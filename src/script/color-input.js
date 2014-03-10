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

    checkValue: function()
    {
        if (this.isMounted())
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
        }
    },

    // the color picker swallows change event, so we just fix this with an interval that checks for
    // changed values and propagates them. not ideal :\
    handleFocus: function (ev)
    {
        this.intervalId = setInterval(this.checkValue, 200);
    },

    handleBlur: function (ev)
    {
        if (this.intervalId)
        {
            clearInterval(this.intervalId);
            this.intervalId = null;
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
        if (this.intervalId)
        {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    componentDidMount: function ()
    {
        this.widget = new jscolor.color(this.getDOMNode());
    },

    render: function ()
    {
        return (
                <input
                    className="color"
                    type="text"
                    defaultValue={this.props.valueLink.value}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                />
        );
    }
});

module.exports = ColorInput;
