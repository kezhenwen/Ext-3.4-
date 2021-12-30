/** 电话微信qq色块 */
Ext.ux.form.ContactField = Ext.extend(Ext.form.CompositeField, {
    width: '99%',
    minHeight: 40,
    height: 40,
    contactLabel: '微信',
    contactName: 'CusWeiXin',
    contactReg: /^([-_a-zA-Z0-9]{5,20})+(,([-_a-zA-Z0-9]{5,20})+)*$/,
    contactRegText: '输入格式不正确，5-20位字母数字下划线横杆组合',
    isCall: false,
    isClose: true,
    isDisplay: false,
    initComponent: function () {
        this.fieldLabel = this.contactLabel;
        this.name = this.contactName;
        this.value = '';
        // 取值赋值容器
        this.hiddenField = new Ext.form.Hidden({
            name: this.contactName,
            setValue: function (v) {
                Ext.form.TextField.superclass.setValue.apply(this, arguments);
                return this;
            }
        });

        if (this.isDisplay) {
            this.isClose = false;
            this.input = new Ext.form.DisplayField();
            this.textControl = new Ext.Container({
                width: this.width,
                height: this.height,
                autoScroll: true,
                items: [this.input]
            });
        } else {
            this.input = new Ext.form.TextField({
                width: 60,
                style: {
                    display: 'inline-block',
                    margin: '0 0 1px 3px',
                    backgroundColor: 'transparent',
                    backgroundImage: 'none',
                    borderColor: 'transparent'
                },
                regex: this.contactReg,
                regexText: this.contactRegText,
                emptyText: '请输入'
            });
            this.textControl = new Ext.Container({
                width: this.width,
                height: this.height,
                autoScroll: true,
                style: {
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) inset',
                    border: '1px solid #b5b8c8'
                },
                items: [this.input]
            });
        }

        Ext.applyIf(this, {
            items: [this.hiddenField, this.textControl]
        });

        Ext.ux.form.ContactField.superclass.initComponent.call(this);
    },
    setValue: function (v) {
        if (this.value != v) {
            this.valueChange(v, this.value);
        }
        this.value = v;
        this.hiddenField.setValue(v);
        //console.log(this.value)
    },
    setItems: function (val) {
        this.textControl.items.each(function (c) {
            if (c != this.input) {
                this.textControl.remove(c, true)
            }
        }, this);
        if (val) {
            var textblocks = val.split(',');
            for (var i = 0; i < textblocks.length; i++) {
                if (textblocks[i]) {
                    var content = '';
                    var blockItem = null;
                    if (this.isClose) {
                        content = '<span class="contact-text" style="display:inline-block;background: #bbd8ff;padding:1px 2px 1px;">' + textblocks[i] +
                            '<i class="x-tool x-tool-close" style="width:11px;height:11px;margin:1px 0 0 2px;background-position:-2px -2px;"></i></span>';                        
                    } else {
                        content =  '<span class="contact-text" style="display:inline-block;background: #bbd8ff;padding:1px 2px 1px;">' + textblocks[i]
                    }
                    blockItem = new Ext.Component({
                        style: {
                            margin: '2px 0 0 3px',
                            display: 'inline-block'
                        },
                        html: content
                    });
                    this.textControl.insert(this.textControl.items.length - 1, blockItem);
                }
            }
        }
        this.textControl.doLayout();
        //console.log(this.textControl.items)
    },
    valueChange: function (v) {
        this.setItems(v)
    },
    getCusId: function () {

    },
    edit: function (t) {
        var texts = this.value.split(',');
        var oldv = t.innerText;
        var editor = new Ext.form.TextField({
            width: 90,
            style: {
                border: '1px solid #8db2e3',
                paddingLeft: '4px'
            },
            regex: this.contactReg,
            regexText: this.contactRegText,
            value: t.innerText
        });
        var button = new Ext.Button({
            width: 24,
            style: {
                display: 'inline-block',
                verticalAlign: 'top'
            },
            iconCls: 'edit_24',
            //text: '保存',
            handler: function () {
                var newv = editor.getValue();
                var reg = this.contactReg;
                if (reg.test(newv)) {
                    if (this.isClose) {
                        t.innerHTML = newv + '<i class="x-tool x-tool-close" style="width:11px;height:11px;margin:1px 0 0 2px;background-position:-2px -2px;"></i></span>';
                    } else {
                        t.innerHTML = newv;
                    }
                    texts.forEach(function (v, i) {
                        if (v == oldv) {
                            texts[i] = newv
                        }
                    })
                    this.setValue(texts.join(','));
                    editTip.hide();
                    editTip.initTarget();
                }
                console.log(this.value)
            },
            scope: this
        })
        var editTip = new Ext.ToolTip({
            width: 136,
            target: t,
            anchor: 'bottom',
            padding: 3,
            autoShow: true,
            autoHide: false,
            items: [editor, button]
        });
        editTip.show();
    },
    listeners: {
        'afterrender': function (me) {
            me.textControl.getEl().on('click', function (e, t, o) {
                if (t.className == 'x-tool x-tool-close') {
                    t.parentElement.parentElement.remove();
                    var texts = me.value.split(',');
                    texts.forEach(function (v, i) {
                        if (v == t.parentElement.innerText) {
                            texts.splice(i, 1);
                        }
                    })
                    me.value = texts.join(',');
                    console.log(me.value)
                } else if (t.className == 'contact-text' && !me.isDisplay) {
                    me.edit(t);
                } else {
                    me.input.focus();
                }
            });
            me.input.getEl().on('keypress', function (e) {
                if (e.keyCode == 13) {
                    //if (me.value) {
                        var reg = me.contactReg;
                        if (reg.test(me.input.getValue())) {
                            me.setValue(me.value + ',' + me.input.getValue());
                            me.input.reset();
                        } else {
                            Ext.Msg.show({
                                title: '错误提示',
                                msg: me.contactRegText,
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.ERROR
                            });
                        }
                    //} else {
                    //    me.setValue(me.input.getValue());
                    //    me.input.reset();
                    //}
                }
            })
        }
    },
    scope: this
});
Ext.reg('ContactField', Ext.ux.form.ContactField);

/** 下拉树控件 */
Ext.ux.form.SearchTreeCombox = Ext.extend(Ext.ux.form.TreeCombox, {
    hiddenName: '',
    height: 300,
    forceSelection: true,
    // 单选模式
    singleSelect: false,
    // 显示搜索栏
    showSearch: true,
    isAllSelected: false,
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
                                combo.setWidth(me.footer.getWidth() - 5 - (!this.singleSelect ? 45 : 0));
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
        this.filter && this.filter.clear();
        this.filter = new Ext.tree.TreeFilter(this.tree, {
            clearBlank: true,
            autoClear: true
        });
        this.filter.filterBy(function (node) {
            return node.text.indexOf(value) >= 0;
        });
        console.log(this.filter)
    },
    setAllSelect: function (pNode, selected) {
        var me = this;
        pNode.eachChild(function (child) {
            child.ui.checkbox.checked = selected;
            child.attributes.checked = selected; 
            if (child.hasChildNodes()) {
                child.expand();
                me.setAllSelect(child, selected);
                child.collapse();
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
        if (values.length > 1) {
            values.forEach(function (v, i) {
                if (i == values.length - 1) {
                    result += v.text;
                } else {
                    result += v.text + ',';
                }
            });
        } else if (values.length == 1) {
            result = values[0].text;
        } else {
            result = '';
        }
        //this.tree.collapseAll();
        this.setValue(result);
        console.log(result)
    }
})
Ext.reg('searchtreecombox', Ext.ux.form.SearchTreeCombox);
