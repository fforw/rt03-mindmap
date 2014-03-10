/** @jsx React.DOM */
"use strict";

var React = require("react");

var TEXT_STYLES = { fill: "#111" };

var Node = React.createClass({

    propTypes: {
        value: React.PropTypes.object.isRequired,
        onClick: React.PropTypes.func.isRequired
    },

    render: function ()
    {
        var node = this.props.value;

        var x = node.xCoordinate - node.width/2;
        var y = node.yCoordinate - node.height/2;

        var styles = {
            fill: "#" + node.color
        };

        return (

            <g className="node">
                <rect
                    x={ x  } y={ y } width={ node.width } height={ node.height }
                    rx={node.width/8} ry={node.width/8}
                    style={ styles }  onClick={ this.props.onClick }/>

                <text x={ x + 6 } y={ y + 18 } style={ TEXT_STYLES } onClick={ this.props.onClick }>{ node.name }</text>
            </g>

        );
    }
});

module.exports = Node;
