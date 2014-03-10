/** @jsx React.DOM */
"use strict";

var React = require("react");

// enhances color input by class
require("./jscolor");

var ColorInput = React.createClass({

    checkValue: function()
    {
        var v = this.getDOMNode().value;
        var link = this.props.valueLink;

        if (link.value !== v)
        {
            link.requestChange(v);
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
        clearInterval(this.intervalId);
    },

    componentDidUpdate: function (prevProps, prevState)
    {
        this.getDOMNode().value = this.props.valueLink.value;
    },

    render: function ()
    {
        return (
                <input
                    className="color"
                    type="text"
                    defaultValue={this.props.valueLink.value}
                    onFocus={this.handleFocus}
                    onBlur={this.handleFocus}
                />
        );
    }
});

module.exports = ColorInput;
