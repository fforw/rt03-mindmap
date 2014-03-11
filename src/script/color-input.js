/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactLink = require("./link");
var color = require("./color");

// enhances color input by class
var jscolor = require("./jscolor");

jscolor.binding = false;

var ColorInput = React.createClass({

    propTypes: {
        valueLink: React.PropTypes.instanceOf(ReactLink).isRequired
    },

    handleChange: function(ev)
    {
        var v = this.getDOMNode().value;
        if (color.isColor(v))
        {
            var link = this.props.valueLink;
            if (link.value !== v)
            {
                link.requestChange(v);
            }
        }
    },

    componentDidUpdate: function (prevProps, prevState)
    {
        var element = this.getDOMNode();
        element.value = this.props.valueLink.value;

        this.widget.importColor();
    },

    componentWillUnmount: function ()
    {
        var elem = this.getDOMNode();
        elem.removeEventListener("change", this.handleChange, false);
    },

    componentDidMount: function ()
    {
        var elem = this.getDOMNode();
        this.widget = new jscolor.color(elem);

        elem.addEventListener("change", this.handleChange, false);
    },

    render: function ()
    {
        return (
                <input
                    className="color"
                    type="text"
                    defaultValue={this.props.valueLink.value}
                />
        );
    }
});

module.exports = ColorInput;
