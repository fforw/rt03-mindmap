/** @jsx React.DOM */
"use strict";

var React = require("react");

function path( nodeA, nodeB)
{
    var centerY = (nodeA.yCoordinate + nodeB.yCoordinate) / 2;

    return "M" + nodeA.xCoordinate + " " + nodeA.yCoordinate + " Q " + nodeB.xCoordinate  + " " + centerY + " " + nodeB.xCoordinate + " " + nodeB.yCoordinate;
}

var Connectors = React.createClass({

    propTypes: {
        value: React.PropTypes.object.isRequired
    },

    render: function ()
    {
        var node = this.props.value;

        var x = node.xCoordinate - node.width/2;
        var y = node.yCoordinate - node.height/2;

        var lines = [];

        node.forEachKid(function(kid)
        {
            lines.push(
                <path key={ kid.id } d={ path(node, kid) } />
            );
        });


        return (

            <g className="connect">
                { lines }
            </g>

        );
    }
});

module.exports = Connectors;
