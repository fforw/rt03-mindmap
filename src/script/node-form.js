/** @jsx React.DOM */

var React = require("react");

var ReactLink = require("./link");
var ColorInput = require("./color-input");
var Command = require("./command");

var keyboardNav = {
    // left
    37: ["leftsibling", "parent"],
    // right
    39: ["rightsibling", "offspring"],
    // up
    38: ["parent"],
    // down
    40: ["offspring"]
};

// aliases for safari
keyboardNav[63234] = keyboardNav[37];	//left
keyboardNav[63235] = keyboardNav[39];	//right
keyboardNav[63232] = keyboardNav[38];	//up
keyboardNav[63233] = keyboardNav[40];	//down

var NodeForm = React.createClass({

    propTypes: {
        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,
        control: React.PropTypes.object.isRequired,
        noEdit: React.PropTypes.bool.isRequired
    },

    getInitialState: function ()
    {
        return {
            editing: this.props.noEdit ? false : 1
        };
    },

    createNodeFieldLink: function (node, name)
    {
        var control = this.props.control;

        return new ReactLink(node && node[name], function (v)
        {
            if (node)
            {
                node[name] = v;

                control.updateNode(node);
                control.setRootNode(control.getRootNode());
            }
        });
    },

    handleKey: function (ev)
    {
        var current, newEditing, navProps;
        var code = ev.keyCode;
        var withModifier = ev.altKey || ev.metaKey  ;

        var control = this.props.control;

        if (code === 27)
        {
            var fn = this.changeEditing(false);
            fn && fn.call(null);
        }

        if (code === 46 && withModifier)
        {
            this.handleDelete(ev);
        }

        var isReturn = code === 13;
        var isComma = code === 188;

        if (isReturn || isComma || (withModifier && (navProps = keyboardNav[code])))
        {
            current = control.findNode(this.state.editing);
            ev.preventDefault();

            if (isReturn)
            {
                this.handleAddChild();
            }
            else if(isComma)
            {
                this.handleAddSibling();
            }
            else
            {
                newEditing = current[navProps[0]];
                if (!newEditing && navProps.length === 2)
                {
                    newEditing = current[navProps[1]];
                }
                if (newEditing)
                {
                    //console.debug("keyboard nav to: %o", newEditing)

                    this.setState({
                        editing: newEditing.id
                    });
                }
            }
        }
        else
        {
            //console.debug("code : %o", code);
        }
    },

    handleHelp: function(ev)
    {
        alert("Hotkeys for adding:\nReturn = add child\n',' = add sibling,\nALT + cursor = navigate, ALT+Delete = delete");
    },

    handleDelete: function(ev)
    {
        var message;
        var control = this.props.control;
        var node = control.findNode(this.state.editing);


        if (node.parent)
        {
            message = "Delete node '" + node.name + "'";

            if (node.offspring)
            {
                message += " and all its children"
            }
        }
        else
        {
            message = "Delete MindMap";
        }

        if (confirm(message + " ?"))
        {
            if (node.parent)
            {
                control.deleteNode(node);
                this.changeEditing(node.leftsibling || node.parent);
            }
            else
            {

                console.debug("reset");

                var newNode = control.createNode();
                newNode.name = "MindMap";
                control.updateNode(newNode);

                control.setRootNode(newNode);
                this.changeEditing(newNode.id);
            }
        }
    },

    handleAddChild: function()
    {
        var control = this.props.control;
        var newNode = control.addNode(control.findNode(this.state.editing));
        this.changeEditing(newNode.id);
    },

    handleAddSibling: function()
    {
        var control = this.props.control;
        var node = control.findNode(this.state.editing);
        if (node && node.parent)
        {
            var newNode = control.addNode(node.parent, node);
            this.changeEditing(newNode.id);
        }
    },

    changeEditing: function(id)
    {
        this.setState({
            editing: id
        });
    },

    handleBackgroundClick: function(ev)
    {
        if (this.state.editing)
        {
            var formElem = this.getDOMNode();

            if (ev.target.tagName === "svg")
            {
                this.changeEditing(false);
            }
        }
    },
    
    componentDidMount: function ()
    {
        window.addEventListener("click", this.handleBackgroundClick, true);

        var textInputElem = this.refs.textInput.getDOMNode();
        textInputElem.select();
    },

    componentWillUnmount: function()
    {
        window.removeEventListener("click", this.handleBackgroundClick, true);
    },

    componentDidUpdate: function (prevProps, prevState)
    {
        if (prevState.editing !== this.state.editing)
        {
            this.refs.textInput.getDOMNode().select();
        }
    },

    render: function ()
    {
        var width = this.props.width;
        var height = this.props.height;

        var control = this.props.control;
        var node = control.findNode(this.state.editing);

        var scale = 1;
        var positionStyles = {};

        var haveParent = false;
        var id = false;
        if (node)
        {
            id = node.id;
            positionStyles = {
                display: "block",
                left: width / 2 + node.xCoordinate * scale - 100,
                top: node.yCoordinate * scale + 36
            };

            haveParent = !!node.parent;
        }
        else
        {
            positionStyles = {
                display: "none"
            };
        }

        return (
            <div
                className="node-form"
                onKeyDownCapture={ this.handleKey }
                style={ positionStyles }>

                <label>
                    Text
                    <input ref="textInput" className="text" type="text" autoFocus="true" valueLink={ this.createNodeFieldLink(node, "name") } />
                </label>
                <label>
                    Color
                    <ColorInput valueLink={ this.createNodeFieldLink(node, "color") } />
                </label>
                <div className="toolbar">
                    <Command text="?" action={this.handleHelp} />
                    <Command text="delete" action={this.handleDelete} disabled={!haveParent}/>
                    <Command text="clear" action={this.handleDelete} disabled={haveParent}/>
                    <Command text="add sibling" action={this.handleAddSibling} disabled={!haveParent} />
                    <Command text="add child" action={this.handleAddChild} />
                </div>
            </div>
        );
    }
});


module.exports = NodeForm;