/** @jsx React.DOM */
"use strict";

var React = require("react");

var ReactLink = require("./link");
var NodeForm = require("./node-form");
var Node = require("./node");
var Connectors = require("./connectors");
var treeLayout = require("./tree-layout");
var measure = require("./measure");

var color = require("./color");

// blacklist redundant measured property
treeLayout.blacklist.measured = 1;

var LAYOUT_OPTIONS = {
    NODE_WIDTH: function(n)
    {
        return n.width;
    },
    NODE_HEIGHT        : 30,  /* Height of a node?      */
    SUBTREE_SEPARATION : 30,   /* Gap between subtrees?  */
    SIBLING_SEPARATION : 20,   /* Gap between siblings?  */
    LEVEL_GAP          : 30    /* Gap between levels?    */
}

var saveTimerId;

function supports_html5_storage()
{
    try
    {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e)
    {
        return false;
    }

}
var nextId = 0;

function Control(app)
{
    this.app = app;
}

Control.prototype = {
    createNode: function ()
    {
        var node = new treeLayout.TreeLayoutNode();

        node.id = ++nextId;

        if (node.id > 1)
        {
            node.name = "New Node " + node.id;
        }
        else
        {
            node.name = "MindMap";
        }

        node.color = "bff5ff";
        node.height = LAYOUT_OPTIONS.NODE_HEIGHT;

        return  node;
    },
    updateNode:function (node)
    {
        var name = node.name;
        if (name !== node.measured)
        {
            node.width = (measure(name) + 16)|0;
            node.measured = name;
        }

        node.tcolor = (color.contrast("#000", node.color) < 5) ? "fff" : "000";

        if (!node.parent)
        {
            document.querySelector("title").textContent = "MindMap: " + node.name;
        }

    },
    getRootNode: function ()
    {
        return this.app.state.rootNode;
    },
    setRootNode: function(root)
    {
        var layout = new treeLayout.TreeLayout(LAYOUT_OPTIONS);
        layout.layout(root);
        this.app.setState({rootNode: root});
    },
    findNode: function (id)
    {
        if (id === false)
        {
            return null;
        }

        var found;
        this.getRootNode().visit(function (n)
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
        var newNode = this.createNode();

        newNode.color = after ? after.color: node.color;

        this.updateNode(newNode);

        target.addChild(newNode, after);

        var rootNode = this.getRootNode();
        this.setRootNode(rootNode);

        return newNode;
    },

    deleteNode: function(node)
    {
        var rootNode = this.getRootNode();

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

        this.setRootNode(rootNode);
    }
};

function findMaxId(node)
{
    var id = node.id;
    if (typeof  id === "number")
    {
        nextId = Math.max(id, nextId);
    }
}

var MindMap = React.createClass({

    getInitialState: function()
    {
        var rootNode, storageNode, control, layout;

        control = new Control(this);

        if (supports_html5_storage())
        {
            var json = window.localStorage["mindMap"];
            storageNode = json && treeLayout.TreeLayoutNode.fromJSON(json);

            console.info("loaded from storage: %o", storageNode);
        }

        if (storageNode)
        {
            storageNode.visit(findMaxId);
            rootNode = storageNode;
        }
        else
        {
            rootNode = control.createNode();
        }

        control.updateNode(rootNode);

        rootNode.xCoordinate = 0;
        rootNode.yCoordinate = 0;

        layout = new treeLayout.TreeLayout(LAYOUT_OPTIONS);
        layout.layout(rootNode);

        return {
            rootNode: rootNode,
            editing: storageNode ? false : rootNode.id
        }
    },

    changeEditing: function (id)
    {
        this.refs.form.changeEditing(id);
    },

    handleResize: function (ev)
    {
        this.forceUpdate();
    },

    save: function()
    {
        if (supports_html5_storage())
        {
            var json = this.state.rootNode.toJSON();
            window.localStorage["mindMap"] = json;

            //console.info("saved: %s", json);
        }
        saveTimerId = null;
    },

    componentDidUpdate: function (prevProps, prevState)
    {
        if (saveTimerId)
        {
            window.clearTimeout(saveTimerId);
        }
        saveTimerId = window.setTimeout(this.save, 1000);
    },

    handleBeforeUnload: function (ev)
    {
        if (!supports_html5_storage())
        {
            var message = "Your browser does not seem to support local storage. If you leave this page, all" +
                "data will be lost.";
            if (ev)
            {
                ev.returnValue = message;
            }
            return message;
        }
        return undefined;
    },

    componentDidMount: function ()
    {
        window.addEventListener("resize", this.handleResize, false);
        window.addEventListener("beforeunload", this.handleBeforeUnload, false);
    },

    componentWillUnmount: function ()
    {
        window.removeEventListener("resize", this.handleResize, false);
        window.removeEventListener("beforeunload", this.handleBeforeUnload, false);
    },

    render: function ()
    {
        var width = window.innerWidth - 1;
        var height = window.innerHeight - 1;

        var rootNode = this.state.rootNode;

        // we need to draw all connectors separately first and then draw the nodes
        // so no connectors overlap any node.
        var nodes = [];
        var connectors = [];

        var app = this;
        rootNode.visit(function (node)
        {
            nodes.push(
                <Node key={ node.id } value={ node } onClick={ app.changeEditing.bind(app, node.id) } />
            );
            connectors.push(
                <Connectors key={ "connect-" + node.id } value={ node } />
            );
        });

        return (
            <div className="app">
                <svg version="1.1"
                    width={ width }
                    height = { height }
                    viewBox={ (-width/2) + " " + (-this.state.rootNode.height) + " " + width + " " + height }>
                    { connectors }
                    { nodes }
                </svg>
                <NodeForm
                    ref="form"
                    width={ width } height={ height }
                    control={ new Control(this) }
                    editing={this.state.editing}
                />
            </div>
        );
    }
});

var mounted = React.renderComponent(
    <MindMap />,
    document.getElementById("container"),
    function()
    {
        console.info("MindApp component mounted");
    }
);
