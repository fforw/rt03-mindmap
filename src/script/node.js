/** @jsx React.DOM */
"use strict";

var React = require("react");

function path(nodeA,nodeB)
{
    var centerY = (nodeA.yCoordinate + nodeB.yCoordinate) / 2;

    return "M" + nodeA.xCoordinate + " " + nodeA.yCoordinate + " Q " + nodeB.xCoordinate  + " " + centerY + " " + nodeB.xCoordinate + " " + nodeB.yCoordinate;
}

var TEXT_STYLES = { fill: "#111" };

var Node = React.createClass({

    renderLines: function ()
    {
        var lines = [];

        var node = this.props.value;
        node.forEachKid(function(kid)
        {
            lines.push(
                <path key={ kid.id } d={ path(node, kid) } />
            );
        });
        return lines;
    },
    render: function ()
    {
        var node = this.props.value;

//        ("render node: %o", node);

        var x = node.xCoordinate - node.width/2;
        var y = node.yCoordinate - node.height/2;

        var styles = {
            fill: "#" + node.color
        };

        return (

            <g className="node">

                { this.renderLines() }

                <rect x={ x  } y={ y } width={ node.width } height={ node.height } style={ styles }  onClick={ this.props.onClick }/>
                <text x={ x + 4 } y={ y + 18 } style={ TEXT_STYLES } onClick={ this.props.onClick }>{ node.name }</text>
            </g>

        );
    }
});

module.exports = Node;
