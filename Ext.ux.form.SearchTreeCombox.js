/**
 * ��������ѡ��������ȫѡ ���Զ���ͻ���ǩ��
 * 
 * */
Ext.ux.form.SearchTreeCombox = Ext.extend(Ext.ux.form.TreeCombox, {
	hiddenName: '',
	height: 300,
	// ���������С���
	minListWidth: 150,  
	forceSelection: true,
	singleSelect: false,
	showSearch: true,
	expandAll: false,
	// �Ƿ���ʾȫѡ��ť
	showAllBtn: false,
	isAllSelected: false,
	// �������ݼ��������ṹ���·�
	localTreeNodes: null,
	// ��ȡѡ�����ڵ��array��ʽ���ݣ��Զ���ͻ���ǩר�ã�
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
		// ���localTreeNode��ֵ���������ݼ�����
		if (this.localTreeNodes) {
			var node = new Ext.tree.AsyncTreeNode();
			this.tree = new Ext.tree.TreePanel({
				height: this.height,
				lines: true,
				autoScroll: true,
				containerScroll: true,
				rootVisible: false,
				loader: new Ext.tree.TreeLoader({
					// �ݹ�����ӽڵ�
					preloadChildren: true
				}),
				root: node
			});
			node.attributes.children = this.localTreeNodes;
			/** ������״���ݽṹ��
				localTreeNodes: [{
					text: '��1',
					expanded: true,
					children: [{
						text: '��1',
						leaf: true
					},{
						text: '��2',
						leaf: true
					}]
				},{
					text: '��2',
					expanded: true,
					children: [{
						text: '��1',
						leaf: true
					}]
				}];		
				Զ�����ݽṹ��
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
							text: !me.isAllSelected ? 'ȫѡ' : 'ȡ��',
							menu: [{
								text: 'ȫѡ',
								handler: function (item) {
									me.menuClick(item);
								}
							},
							{
								text: 'ȡ��',
								handler: function (item) {
									me.menuClick(item);
								}
							}],
							listeners: {
								"click": function (btn) {
									if (me.isAllSelected) {
										me.selectNone();
										btn.setText('ȫѡ');
									} else {
										me.selectAll();
										btn.setText('ȡ��');
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
		if (this.clickMode == 0) // ��Ҷ�ڵ��Ƿ�����ѡ   
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
			// ֻ����û�д�����ֵ���ӽڵ㣬���ڵ㲻����
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
		if (menuItem.text == 'ȫѡ') {
			this.selectAll();
			this.isAllSelected = true;
			Ext.getCmp('SearchTreeCombox_SearchMenu').setText('ȡ��');
		} else {
			this.selectNone();
			this.isAllSelected = false;
			Ext.getCmp('SearchTreeCombox_SearchMenu').setText('ȫѡ');
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

		// ������Ҫ���ڵ��ѡ������
		return resultArr;
	},
	setValue: function (v) {
		if (this.checkedValType && v == '') { //����
			this.selectNone();
		}
		Ext.ux.form.TreeCombox.superclass.setValue.apply(this, arguments);
		return this;
	},
	// �Զ���ͻ���ǩ���ݴ���
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