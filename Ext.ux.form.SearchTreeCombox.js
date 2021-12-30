/**
 * 下拉树勾选带搜索和全选 （自定义客户标签）
 * 
 * */
Ext.ux.form.SearchTreeCombox = Ext.extend(Ext.ux.form.TreeCombox, {
	hiddenName: '',
	height: 300,
	// 下拉框的最小宽度
	minListWidth: 150,  
	forceSelection: true,
	singleSelect: false,
	showSearch: true,
	expandAll: false,
	// 是否显示全选按钮
	showAllBtn: false,
	isAllSelected: false,
	// 本地数据加载树，结构见下方
	localTreeNodes: null,
	// 获取选中树节点的array格式数据（自定义客户标签专用）
	checkedValType: true,
	initComponent: function () {
		//this.hiddenField = new Ext.form.Hidden({
		//    name: this.hiddenName,
		//    setValue: function (v) {
		//        Ext.form.TextField.superclass.setValue.apply(this, arguments);
		//        return this;
		//    }
		//});
		//Ext.apply(this, { items: [this.hiddenField] })
		Ext.ux.form.SearchTreeCombox.superclass.initComponent.call(this);
		var me = this;

		this.value = '';
		this.tree.height = this.height;
		this.tree.lines = true;
		this.tree.autoScroll = true;
		this.tree.containerScroll = true;
		// 如果localTreeNode有值，本地数据加载树
		if (this.localTreeNodes) {
			var node = new Ext.tree.AsyncTreeNode();
			this.tree = new Ext.tree.TreePanel({
				height: this.height,
				lines: true,
				autoScroll: true,
				containerScroll: true,
				rootVisible: false,
				loader: new Ext.tree.TreeLoader({
					// 递归加载子节点
					preloadChildren: true
				}),
				root: node
			});
			node.attributes.children = this.localTreeNodes;
			/** 本地树状数据结构：
				localTreeNodes: [{
					text: '父1',
					expanded: true,
					children: [{
						text: '子1',
						leaf: true
					},{
						text: '子2',
						leaf: true
					}]
				},{
					text: '父2',
					expanded: true,
					children: [{
						text: '子1',
						leaf: true
					}]
				}];		
				远程数据结构：
				//loaderConfig: {
				//	baseParams: {
				//		method: 'viewRoleModules',
				//		moduleId: 'adminmanage',
				//		Id: 1
				//	},
				//	dataUrl: MyDesk.App.connection,
				//},
			 */
		}


		this.tree.on("checkchange", function (node, checked) {
			if (me.singleSelect) {
				me.setAllSelect(me.tree.getRootNode(), false);
				node.parentNode.expand();
				node.ui.checkbox.checked = checked;
				node.attributes.checked = checked;
			}
			//me.getCheckedValue();
		});

		this.on({
			expand: function () {
				if (!me.extendedPageTb && me.showSearch && !me.footer && me.list) {
					var fbar = [];
					if (!me.singleSelect) {
						fbar.push({
							xtype: 'splitbutton',
							id: 'SearchTreeCombox_SearchMenu',
							iconCls: '',
							hidden: !me.showAllBtn,
							text: !me.isAllSelected ? '全选' : '取消',
							menu: [{
								text: '全选',
								handler: function (item) {
									me.menuClick(item);
								}
							},
							{
								text: '取消',
								handler: function (item) {
									me.menuClick(item);
								}
							}],
							listeners: {
								"click": function (btn) {
									if (me.isAllSelected) {
										me.selectNone();
										btn.setText('全选');
									} else {
										me.selectAll();
										btn.setText('取消');
									}
								}
							}
						});
						fbar.push('->');
					}
					fbar.push({
						ref: '../SearchBox',
						hidden: !me.showSearch,
						xtype: 'ux-searchbox',
						searchFunction: function (value) {
							me.searchTree(value);
						},
						clearFunction: function () {
							me.filter.clear();
						},
						listeners: {
							"afterrender": function (combo, record, index) {
								if (me.showAllBtn) {
									combo.setWidth(me.footer.getWidth() - 5 - (!this.singleSelect ? 45 : 0));
								} else {
									combo.setWidth(me.footer.getWidth() - 5);
								}
							},
							scope: this
						}
					});
					var cls = 'x-combo-list';
					me.footer = me.list.createChild({
						cls: cls + '-ft'
					});
					me.extendedPageTb = new Ext.Toolbar({
						renderTo: me.footer,
						items: fbar
					});
					me.list.dom.childNodes[0].style.height = me.height + 'px';
				}
			},
			collapse: function () {
				me.getCheckedValue();
				me.filter && me.filter.clear();
			}
		});


	},
	initHeight: function () {
		this.showSearch && this.list.setHeight(this.tree.getEl().getHeight() + this.footer.getHeight());
	},
	onNodeExpand: function (node) {
		//!this.value && this.getCheckedValue();
		this.initHeight();
	},
	onNodeCollapse: function (node) {
		this.initHeight();
	},
	clickNode: function (node) {
		var isRoot = (node == this.tree.getRootNode());
		var selModel = this.selectNodeModel;
		if (this.clickMode == 0) // 非叶节点是否允许被选   
		{
			var isLeaf = node.isLeaf();
			if (isRoot && selModel != 'all') {
				return;
			} else if (selModel == 'folder' && isLeaf) {
				return;
			} else if (selModel == 'leaf' && !isLeaf) {
				return;
			}
		}
		this.fireEvent("afterClickNode", this, node);
		//this.collapse();
	},
	searchTree: function (value) {
		if (!value) {
			this.filter.clear();
			return;
		}
		this.filter && this.filter.clear();
		this.filter = new Ext.tree.TreeFilter(this.tree, {
			clearBlank: true,
			autoClear: true
		});
		this.filter.filterBy(function (node) {
			var reg = new RegExp(Ext.escapeRe(value));
			// 只过滤没有此搜索值的子节点，父节点不过滤
			return !node.isLeaf() || reg.test(node.text);
		});
	},
	setAllSelect: function (pNode, selected) {
		var me = this;
		pNode.eachChild(function (child) {
			child.ui.checkbox && (child.ui.checkbox.checked = selected);
			child.ui.checkbox && (child.attributes.checked = selected);
			if (child.hasChildNodes()) {
				child.expand();
				me.setAllSelect(child, selected);
				!me.checkedValType && child.collapse();
			}
		});
	},
	selectAll: function () {
		this.setAllSelect(this.tree.getRootNode(), true);
		this.isAllSelected = true;
	},
	selectNone: function () {
		this.setAllSelect(this.tree.getRootNode(), false);
		this.isAllSelected = false;
	},
	menuClick: function (menuItem) {
		if (menuItem.text == '全选') {
			this.selectAll();
			this.isAllSelected = true;
			Ext.getCmp('SearchTreeCombox_SearchMenu').setText('取消');
		} else {
			this.selectNone();
			this.isAllSelected = false;
			Ext.getCmp('SearchTreeCombox_SearchMenu').setText('全选');
		}
		this.expand();
	},
	getCheckedValue: function () {
		this.filter && this.filter.clear();
		//this.tree.expandAll();
		var values = this.tree.getChecked();

		var result = '';
		if (this.checkedValType) {
			var resultArr = [];
			if (values.length) {
				values.forEach(function (v, i) {
					resultArr.push({
						parentText: v.parentNode.text,
						text: v.text
					})
					if (i == values.length - 1) {
						result += v.parentNode.text + ':' + v.text;
					} else {
						result += v.parentNode.text + ':' + v.text + ';';						
					}
				});
			} else {
				resultArr = [];
				result = '';
			}
		} else {
			if (values.length) {
				values.forEach(function (v, i) {
					if (i == values.length - 1) {
						result += v.text;
					} else {
						result += v.text + ',';
					}
				});
			} else {
				result = '';
			}
		}
		this.setValue(result);
		//console.log(result)

		// 用于需要父节点的选中数据
		return resultArr;
	},
	setValue: function (v) {
		if (this.checkedValType && v == '') { //重置
			this.selectNone();
		}
		Ext.ux.form.TreeCombox.superclass.setValue.apply(this, arguments);
		return this;
	},
	// 自定义客户标签数据处理
	formatTreeNodes: function (arr) {
		if (this.treeNodes) {
			return this.treeNodes;
		} else {
			var result = [];
			var tagList = arr;

			tagList.forEach(function (item) {
				var newItem = {
					text: item.TagName,
					//iconCls: 'tag-bag-icon',
					//iconCls: 'icon-images',
					expanded: true,
					children: []
				};
				item.TagValues.forEach(function (citem) {
					newItem.children.push({
						text: citem,
						//iconCls: 'tag-icon',
						//iconCls: 'icon-image_add',
						checked: false,
						leaf: true
					});
				})
				result.push(newItem);
			});
			this.treeNodes = result;
			return result;
		}
	}
});
Ext.reg('searchtreecombox', Ext.ux.form.SearchTreeCombox);