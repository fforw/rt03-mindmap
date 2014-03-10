/** @jsx React.DOM */

var React = require("react");

var ReactLink = require("./link");
var ColorInput = require("./color-input");
var Command = require("./command");

var measure = require("./measure");

function getNodeId(props)
{
    var node = props.valueLink.value;
    return node && node.id;
}

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


var NodeForm;
NodeForm = React.createClass({

    getInitialState: function ()
    {
        return {
            editing: 1
        };
    },

    createNodeFieldLink: function (node, name)
    {
        var rootLink = this.props.valueLink;

        return new ReactLink(node && node[name], function (v)
        {
            if (node)
            {
                node[name] = v;

                if (name === "name")
                {
                    node.width = measure(node.name) + 12;
                }

                rootLink.requestChange(rootLink.value);
            }
        });
    },

    handleKey: function (ev)
    {
        var current, newEditing, navProps;
        var code = ev.keyCode;
        var withAltKey = ev.altKey;

        if (code === 27)
        {
            var fn = this.changeEditing(false);
            fn && fn.call(null);
        }

        if (code === 46 && withAltKey)
        {
            this.handleDelete(ev);
        }

        var isReturn = code === 13;
        var isComma = code === 188;

        if (isReturn || isComma || (withAltKey && (navProps = keyboardNav[code])))
        {
            current = this.findNode(this.state.editing);
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
                    console.debug("keyboard nav to: %o", newEditing)

                    this.setState({
                        editing: newEditing.id
                    });
                }
            }
        }
        else
        {
            console.debug("code : %o", code);
        }
    },

    handleHelp: function(ev)
    {
        alert("Hotkeys for adding:\nReturn = add child\n, = add sibling,\nALT + cursor = navigate, ALT+Delete = delete");
    },

    handleDelete: function(ev)
    {
        var node = this.findNode(this.state.editing);

        if (!node.parent)
        {
            return;
        }

        var message = "Delete node '" + node.name;

        if (node.offspring)
        {
            message += " and all its children"
        }

        if (confirm(message + "'?"))
        {
            this.deleteNode(node);
        }
    },

    handleAddChild: function()
    {
        this.addNode(this.findNode(this.state.editing));
    },

    handleAddSibling: function()
    {
        var node = this.findNode(this.state.editing);
        if (node && node.parent)
        {
            this.addNode(node.parent, node);
        }
    },

    findNode: function (id)
    {
        if (id === false)
        {
            return null;
        }

        var found;
        this.props.valueLink.value.visit(function (n)
        {
            if (n.id === id)
            {
                found = n;
                return false;
            }
            return true;
        })

        return found;
    },

    addNode: function(node, after)
    {
        var target = this.findNode(node.id);
        var newNode = this.props.createNode();
        target.addChild(newNode, after);

        var link = this.props.valueLink;
        var rootNode = link.value;

        this.changeEditing(newNode.id);

        link.requestChange(rootNode);
    },

    deleteNode: function(node)
    {
        var link = this.props.valueLink;
        var rootNode = link.value;

        var ls = node.leftsibling;
        var rs = node.rightsibling;
        if (ls)
        {
            ls.rightsibling = rs;
        }
        else
        {
            node.parent.offspring = null;
        }

        if (rs)
        {
            rs.leftsibling = ls;
        }

        this.changeEditing(false);
        link.requestChange(rootNode);
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

        var node = this.findNode(this.state.editing);

        var scale = 1;
        var positionStyles = {};

        var haveParent = false;
        if (node)
        {
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
                    <Command text="add sibling" action={this.handleAddSibling} disabled={!haveParent} />
                    <Command text="add child" action={this.handleAddChild} />
                </div>
            </div>
        );
    }
});


module.exports = NodeForm;