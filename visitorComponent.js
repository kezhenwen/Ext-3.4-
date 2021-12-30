// 新插件只需要在home页面末尾加载本js即可，无需再修改商务通之前的内部代码；
var yhtPlugin = new YhtCRMPlugin();

/**
 * @module 商务通对接医汇通插件
 * @constructor
 * @version 7.2021.7.21
 *
 * @param opt  非必传 string/object  	传string，版本号字符串；传object，{version:'',minPort:'',maxPort:'',duringTime:''}
 * @method setDuringTime(t)  	设置坐席请求间隔时间（ms）
 * @method  setMinPort(p)  		设置最小端口号 @param p Number
 * @method  setMaxPort(p)  		设置最大可用端口号的下一位 @param p Number
 * */
function YhtCRMPlugin(opt){
	
	// 插件版本号
	var Version = '7.2021.7.21';
	var minPort = 35120;
	var maxPort = 35130;
	var duringTime = 30000;
	// 对话模块
	var chatWindow = document.getElementById('frmTalkBody').contentWindow;
	// 提交模块
	var quickWindow = document.getElementById('frmQuick').contentWindow;
	// 用于区别手动点击加载更多和提交加载更多
	var subBtnLoadFlag = false;
	this.timer = null;
	
	if(opt){
		var reg = /\d{1,2}\.\d{4}\.\d{1,2}\.\d{1,2}/;
		if(typeof opt === 'string' && reg.test(opt)){
			Version = opt;
		}
		if(typeof opt === 'object'){
			Version = opt.version || Version;
			minPort = opt.minPort || minPort;
			maxPort = opt.maxPort || maxPort;
			duringTime = opt.duringTime || duringTime;					
		}				
	}
	
	// 覆盖对话模块加载更多方法	
	chatWindow.loadMoreHistory = function(element, callback){
		//console.log(11)
		switch (chatWindow.vmapp.chatInfo.apptype) {
		case 2:
		  var histicks = chat_msg_list.querySelector('div[data-ticks]').dataset.ticks;
		  var hismsgid = chat_msg_list.querySelector('div[data-msgid]').dataset.msgid;

		  if (!element.classList.contains('isloading') && element.innerHTML.indexOf('查看更多消息') > -1) {
			chatWindow.talkObj.GetWeiboHistory(JSON.stringify({ msgid: hismsgid, ticks: histicks, sessionid: chatWindow.top.sys_options.currentSessionId }));
			load_more_talkrecord.dataset.pageindex = load_more_talkrecord.dataset.pageindex + 1;
			element.innerHTML = '<img src="image/load1.gif" width="14" />';
			element.classList.add('isloading');
		  }
		  break;
		case 1:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		  if (!element.classList.contains('isloading')) {
			chatWindow.talkObj.GetChatHistory(JSON.stringify({ sessionid: chatWindow.top.sys_options.currentSessionId }));
			element.innerHTML = '<img src="image/load1.gif" width="14" />';
			element.classList.add('isloading');
			callback && callback();
		  }
		  break;
	  }		
	};
	
	// 覆盖对话模块加载更多的回调方法	
	chatWindow.AsyncGetChatHistoryFuncCallback = function(obj){
		//console.log(11)
		var loadBtnWrap = $(window.frames['frmTalkBody'].document).find('#load_more_talkrecord');	
		loadBtnWrap.find('a').removeClass('isloading');
		loadBtnWrap.find('a').html('<i class="iconfont icon-more-record"></i> &nbsp;查看更多消息');
		if (!obj.success) {
			chatWindow.top.tip.show(obj.error, 3000, { icon: false });
			return;
		}
		if (obj.msglist.length < 1) {
			loadBtnWrap.hide();
			//获取访客信息
			subBtnLoadFlag && saveVisitorInfo();
		} else {
			for (var idx in obj.msglist) {
				if (chatWindow.vmapp.chatInfo.apptype === 7) {
					if (chatWindow.ReplaceNotImageTag(obj.msglist[idx].msgcontent) != '') {
					chatWindow.ExtdWXBIZ.fnMessageHandle(obj.msglist[idx], true);
					}
				} else {
					chatWindow.fnBulidMessage(obj.msglist[idx], true);
					if(loadBtnWrap.find('a')){			
						subBtnLoadFlag && chatWindow.loadMoreHistory(loadBtnWrap.find('a')[0]);
					}
				}
			}
		}		
	};
	
	function checkLogin(){
		var promiseArr = [];
		for( var i=minPort; i<maxPort; i++ ){
			(function(port){
				promiseArr.push(new Promise(function(resolve, reject){
					$.ajax({
					  url: 'http://127.0.0.1:' + port + '/api/OnlineAskSoft/CheckLogin',
					  type: 'GET',
					  success: function(data) {	
						if(data.code==200){
							resolve({
								userName: data.data.UserName+'（'+data.data.DepartmentName+'）',
								baseUrl: 'http://127.0.0.1:'+port
							});
						}
					  },
					  error: function (response, ajaxOptions, thrownError) {
						reject();
					  }
					})
				}))
			})(i);
		}
		return promiseArr;		
	};
	
	function loadMoreChat(){
		var zuoxiName = $(window.frames['frmQuick'].document).find('#visitor_zuoxi option:selected').text();  
		  var zuoxiVal = $(window.frames['frmQuick'].document).find('#visitor_zuoxi option:selected').val();  
		  var load_more_talkrecord = chatWindow.document.getElementById('load_more_talkrecord');
		  if(!load_more_talkrecord){
			quickWindow.top.tip.show('请选中左侧访客', 3000, { icon: false });
			return
		  }
		  if(!zuoxiVal || zuoxiName=='设置医汇通坐席（必选）'){
			quickWindow.top.tip.show('请设置医汇通坐席', 3000, { icon: false });
			return
		  }
		  if(load_more_talkrecord.children[0]){
			chatWindow.loadMoreHistory(load_more_talkrecord.children[0], function(){	  
				$(window.frames['frmQuick'].document).find('.visitorSubBtn').attr('disabled', true);
				subBtnLoadFlag = true;  
			});
		  }else {
			$(window.frames['frmQuick'].document).find('.visitorSubBtn').attr('disabled', true);
			subBtnLoadFlag = true; 
		  }		
	};
	
	function urlParse(url) {
		var obj = {};
		var reg = /[?&][^?&]+=[^?&]+/g;
		var arr = url.match(reg);
		 if (arr) {
			arr.forEach(function(item){
				var tempArr = item.substring(1).split('=');
				var key = decodeURIComponent(tempArr[0]);
				var val = decodeURIComponent(tempArr[1]);
				obj[key] = val;
			  });
		 }
		return obj;
	};	
	
	function sexFormat(sexVal) {
		switch (sexVal){
			case '1':
				return '男';
				break;
			case '2':
				return '女';
				break;
			default: 
				return '未知';
		}
	};
	
	function setCrmBox(){
		var archive = quickWindow.document.getElementById('crmbox');
		if(!archive.querySelector('.visitorSubBtn')){
			var subBtn = document.createElement('button');
			subBtn.className = 'btn btn-blue btn-bluebg animBtn hover-style visitorSubBtn';
			subBtn.style.marginTop = '10px';
			subBtn.onclick = loadMoreChat;
			subBtn.innerText = '提交到医汇通';
			archive.appendChild(subBtn);	
			var version = document.createElement('div');
			version.className = 'item40 YHTVersion';
			version.style.color = '#999';
			version.style.paddingLeft = '10px';
			version.style.textAlign = 'center';
			version.innerText = '插件版本：V' + Version;
			archive.appendChild(version);
		}else {
			archive.querySelector('.YHTVersion').innerText = '插件版本：V' + Version;
		}  		
	};
	
	function loadZuoxi(){
	  console.time('获取坐席')
	  var archive = quickWindow.document.getElementById('crmbox');
	  var checkedOption = $(window.frames['frmQuick'].document).find('#visitor_zuoxi option:selected').val();
	  var zuoxiEle = document.createElement('div');  
	  zuoxiEle.id = 'zuoxiWrap'; 
	  zuoxiEle.className = 'item40';  
	  var zuoxiSel = document.createElement('select'); 
	  zuoxiSel.id = 'visitor_zuoxi';
	  
	  var promiseArr = checkLogin();
	  var allPromise = [];
	  for(var i=0;i<promiseArr.length;i++){
		  allPromise.push(promiseArr[i].catch(function(){status:'failed'}));
	  }
	  Promise.all(allPromise).then(function(res){
		console.timeEnd('获取坐席')
		 var res = res.filter(Boolean);
		 var archive = quickWindow.document.getElementById('crmbox');
		 var subBtn = archive.querySelector('.visitorSubBtn');
		 var yhtVersion = archive.querySelector('.YHTVersion');
		console.log(res)
		if(res.length){
			var loginUserData = res;
			zuoxiSel.innerHTML = loginUserData.length>1 ? '<option value="0">设置医汇通坐席（必选）</option>' : '';
			for(var i=0;i<loginUserData.length;i++){
				zuoxiSel.innerHTML += '<option value="'+loginUserData[i].baseUrl+'">'+loginUserData[i].userName+'</option>';
			}
			if(archive.querySelector('#zuoxiWrap')){
			  zuoxiEle = archive.querySelector('#zuoxiWrap');
			  zuoxiEle.innerHTML = '<label>坐席</label>'; 
			  zuoxiEle.appendChild(zuoxiSel);	
			}else {
			  zuoxiEle.innerHTML = '<label>坐席</label>'; 
			  zuoxiEle.appendChild(zuoxiSel);
			  archive.insertBefore(zuoxiEle, archive.querySelector('.taglistbox').nextSibling);
			} 
			subBtn.style.zIndex = 0;
			subBtn.style.opacity = 1;		
			subBtn.removeAttribute('disabled');
			yhtVersion.style.opacity = 1;	
			zuoxiEle.style.position = 'unset';
			zuoxiEle.style.zIndex = 0;
			zuoxiEle.style.opacity = 1;
			// 如果之前有选中的, 并且这次加载的坐席里也有,就选中之前的
			checkedOption && $(window.frames['frmQuick'].document).find('#visitor_zuoxi').val(checkedOption);
			// 只有一条数据隐藏下拉框
			if(loginUserData.length==1){	
				zuoxiEle.style.position = 'absolute';
				zuoxiEle.style.zIndex = -1;
				zuoxiEle.style.opacity = 0;
				$(window.frames['frmQuick'].document).find('#visitor_zuoxi option:first').prop("selected", 'selected');
			}
		}else {
			// 如果没有登录医汇通账号，隐藏提交到医汇通按钮
			if(subBtn){
				subBtn.style.zIndex = -1;
				subBtn.style.opacity = 0;
				yhtVersion.style.opacity = 0;	
			}
			if(archive.querySelector('#zuoxiWrap')){
				zuoxiEle = archive.querySelector('#zuoxiWrap');
				zuoxiEle.style.position = 'absolute';
				zuoxiEle.style.zIndex = -1;
				zuoxiEle.style.opacity = 0;
			}
		}	  
	  }).catch(function(error) {
		// console.log(error)
	  });   		
	};
		
	function saveVisitorInfo(){
		var archive = quickWindow.document.getElementById('crmbox');
	  var vm_customdoc = document.getElementById('frmQuick').contentWindow.vm_customdoc;
	  var localUrl = $(window.frames['frmQuick'].document).find('#visitor_zuoxi option:selected').val();
	  var localName = $(window.frames['frmQuick'].document).find('#visitor_zuoxi option:selected').text().split('（')[0];
	  var visitorInfo = chatWindow.current_options.visitor_info;
	  var sourceurl = chatWindow.document.getElementById('talk-trail').querySelector('a').href;
	  var UrlReg = /^(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/;
	  
	  if(!localUrl){
		  quickWindow.top.tip.show('请设置医汇通坐席', 3000, { icon: false});	
		  $(window.frames['frmQuick'].document).find('.visitorSubBtn').removeAttr('disabled');
		  return;
	  }
	  var visitor = {
		CusHisId: '',
		CusFullName: vm_customdoc.visitor.name||vm_customdoc.visitorOld.name,
		CusSex: vm_customdoc.visitor.sex||vm_customdoc.visitorOld.sex,
		CusAge: vm_customdoc.visitor.age||vm_customdoc.visitorOld.age,
		CusChannel: '网络咨询',
		CusSource: '',
		ConsultTool: '商务通',
		ConsultOperator: localName,
		CusPhone: vm_customdoc.visitor.mobile||vm_customdoc.visitorOld.mobile,
		CusWeiXin: vm_customdoc.visitor.wxcode||vm_customdoc.visitorOld.wxcode,
		CusQQ: vm_customdoc.visitor.qq||vm_customdoc.visitorOld.qq,
		CusEmail: vm_customdoc.visitor.email||vm_customdoc.visitorOld.email,
		CusAddress: vm_customdoc.visitor.address||vm_customdoc.visitorOld.address,
		CusNotes: vm_customdoc.visitor.remark||vm_customdoc.visitorOld.remark,	
		// 开始时间
		CusStartAccessTime: visitorInfo.opentime,
		// 来源地址
		CusSourceUrl: sourceurl,
		// 搜索词
		CusKeyword: visitorInfo.searchkeyword||'',
		// 落地页
		CusFirstUrl: visitorInfo.firsturl,
		// 永久身份
		CusVisitorIdentify: visitorInfo.visitorid,
		// 商务通站点id
		CusStationId: chatWindow.current_options.siteid,
		CusUtmSource: '',
		CusLevel: '',
		CusProvince: '',
		CusCity: '',
		CusDistrict: '',
		CusUtmTerm: '',
		CusUtmMedium: '',
		CusUtmContent: '',
		CusSiteGroup: '',
		CusUtmAccount: '',
		CompanyID: '',
		OnlAskContent: '',
		CusUtmCampaign: '',
		CusAskSource: '',
		IpInfo: ''
	  };
	  
	  // 性别
	  visitor.CusSex = sexFormat(visitor.CusSex);  
	  // 对话内容
	  visitor.OnlAskContent = chatWindow.document.getElementById('chat_msg_list').innerHTML + '<style>.christmasTalk{display:none;}</style>';
	  visitor.OnlAskContent = visitor.OnlAskContent.replace(/\<img src\="image\/newyear\/yearicon.png"/g, '<img src="image/newyear/yearicon.png" onerror="this.onerror=null"');
	  // 广告名称
	  visitor.CusUtmCampaign = visitorInfo.currenturltitle ? visitorInfo.currenturltitle : '';
	  // 对话来源
	  visitor.CusAskSource = visitorInfo.currenturl ? visitorInfo.currenturl : '';
	  if(visitorInfo.source_type){
		// 对话来源 取来源网址的最后一个
		visitor.CusAskSource = visitorInfo.sourceurl ? visitorInfo.sourceurl[visitorInfo.sourceurl.length-1] : '';   
		// 广告来源/营销方式
		visitor.CusUtmSource = visitorInfo.source_type;
		// 如果获取到的不是url，就传空
		if(visitorInfo.source_type =='friendlink'){
		  if(!UrlReg.test(visitor.CusAskSource)){
			  visitor.CusAskSource = '';
		  }
		  if(!UrlReg.test(visitor.CusSourceUrl)){
			  visitor.CusSourceUrl = '';
		  }
		  if(!UrlReg.test(visitor.CusFirstUrl)){
			  visitor.CusFirstUrl = '';
		  }
		}
	  }
	  // 如果来源地址url符合含有utm参数
	  if(sourceurl && UrlReg.test(sourceurl)){
		var urlParams = urlParse(sourceurl);
		urlParams.utm_source && (visitor.CusUtmSource = urlParams.utm_source);
		urlParams.utm_medium && (visitor.CusUtmMedium = urlParams.utm_medium);
		urlParams.utm_campaign && (visitor.CusUtmCampaign = urlParams.utm_campaign);
		urlParams.utm_content && (visitor.CusUtmContent = urlParams.utm_content);
		urlParams.utm_term && (visitor.CusUtmTerm = urlParams.utm_term);
		urlParams.hmsr && (visitor.CusUtmSource = urlParams.hmsr);
		urlParams.hmpl && (visitor.CusUtmMedium = urlParams.hmpl);
		urlParams.hmcu && (visitor.CusUtmCampaign = urlParams.hmcu);
		urlParams.hmci && (visitor.CusUtmContent = urlParams.hmci);
		urlParams.hmkw && (visitor.CusUtmTerm = urlParams.hmkw);
	  }
	  
	    
	  var GetIpInfo = new Promise(function(resolve, reject){
		  $.ajax({
			  url: localUrl + '/api/OnlineAskSoft/GetIpInfo?ip='+ visitorInfo.ip,
			  type: 'GET',
			  success: function(data) {	
				if(data.code==200){
					resolve(data)
				}
			  },
			  error: function (response, ajaxOptions, thrownError) {
				reject(response);
			  }
			})
	  });  
	  GetIpInfo.then(function(res){  
			if(res.code == 200){
				visitor.IpInfo = res.data;
			}	
			$(window.frames['frmQuick'].document).find('.visitorSubBtn').removeAttr('disabled');
			subBtnLoadFlag = false; 
			console.log(visitor);
			console.log(localUrl);
			//  提交访客数据到医汇通	
			$.ajax({
			  url: localUrl + '/api/OnlineAskSoft/SaveCustomerInfo',
			  type: 'POST',
			  contentType: "application/json;charset=utf-8",
			  data: JSON.stringify(visitor),
			  dataType: 'json',
			  success: function(data) {
				if(data.code == 200) {
				  //console.log('success');	  	
				}else {
				  //console.log(data.info);
				  quickWindow.top.tip.show(data.info, 3000, { icon: false });			
				}		
			  },
			  error: function (data, ajaxOptions, thrownError) {
				//console.log('error');	
				quickWindow.top.tip.show(data.responseText, 3000, { icon: false });
			  }
			});	
	   }).catch(function(error){
			console.log(error);
			quickWindow.top.tip.show('此坐席已下线或接口连接失败', 3000, { icon: false });
			$(window.frames['frmQuick'].document).find('#visitor_zuoxi option:first').prop("selected", 'selected');
			$(window.frames['frmQuick'].document).find('.visitorSubBtn').removeAttr('disabled'); 
	   });		
	};
		
	function init(){
		setCrmBox();
		loadZuoxi();
		this.timer && clearInterval(this.timer);
		this.timer = setInterval(function(){
			loadZuoxi();
		}, duringTime);
	}
	
		
	this.setDuringTime = function(time){
		if(!time)return;
		duringTime = time;
		init();
	};
	
	this.setMinPort = function(port){
		if(!port)return;
		minPort = port;
		init();
	};
	
	this.setMaxPort = function(port){
		if(!port||port<minPort)return;
		maxPort = port;
		init();
	};
	
	init();	
};

// 防止之前插入的js报错；去掉之前在商务通插入的两行js后，可以删除这行
function getVisitorInfo(){};

