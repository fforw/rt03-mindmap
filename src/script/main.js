/** @jsx React.DOM */
"use strict";

var React = require("react");

var ReactLink = require("./link");
var NodeForm = require("./node-form");
var Node = require("./node");
var treeLayout = require("./tree-layout");
var measure = require("./measure");


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

var nextId = 1;
function createNode()
{
    var node = new treeLayout.TreeLayoutNode();

    node.id = nextId++;

    node.name = "New Node";

    if (node.id > 1)
    {
        node.name = "New Node " + node.id;
    }
    else
    {
        node.name = "MindMap";
    }

    node.color = "bff5ff";
    node.width = measure(node.name) + 12;
    node.height = LAYOUT_OPTIONS.NODE_HEIGHT;

    return  node;
}


var MindMap = React.createClass({

    getInitialState: function()
    {
        var rootNode = createNode();

        rootNode.xCoordinate = 0;
        rootNode.yCoordinate = 0;

        var layout = new treeLayout.TreeLayout(LAYOUT_OPTIONS);
        layout.layout(rootNode);

        return {
            rootNode: rootNode,
            editing: 1
        }
    },

    changeEditing: function (id)
    {
        this.refs.form.changeEditing(id);
    },

    render: function ()
    {
        var width = window.innerWidth -1;
        var height = window.innerHeight - 1;

        var components = [];

        var rootNode = this.state.rootNode;
        var app = this;

        rootNode.visit(function (node)
        {
            components.push(
                <Node key={ node.id } value={ node } onClick={ app.changeEditing.bind(app, node.id) } />
            );
        });

        var link = new ReactLink(this.state.rootNode, function (root)
        {
            var layout = new treeLayout.TreeLayout(LAYOUT_OPTIONS);
            layout.layout(root);
            app.setState(root);
        });

        return (
            <div className="app">
                <svg version="1.1"
                    width={ width }
                    height = { height }
                    onClick={ this.handleBackgroundClick }
                    viewBox={ (-width/2) + " " + (-this.state.rootNode.height) + " " + width + " " + height }>
                    { components }
                </svg>
                <NodeForm
                    ref="form"
                    valueLink={ link }
                    width={ width } height={ height }
                    createNode={createNode} />
            </div>
        );
    }
});

var mounted = React.renderComponent(
    <MindMap />,
    document.getElementById("container"),
    function()
    {
        console.info("app mounted");
    }
);
