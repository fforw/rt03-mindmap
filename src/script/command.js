/** @jsx React.DOM */
"use strict";

var React = require("react");

var Command = React.createClass({

    getDefaultProps: function ()
    {
        return {
            name: "unnamed",
            disabled: false
        };
    },

    handleClick: function (ev)
    {
        if (!this.props.disabled)
        {
            this.props.action.call(null, this.props.text);
        }
        ev.preventDefault();
    },

    render: function ()
    {
        var disabled = this.props.disabled;

        if (disabled)
        {
            return <span/>
        }
        return (
                <a
                    className="command"
                    href={ "//" + encodeURI(this.props.text) }
                    onClick={ this.handleClick }>
                { this.props.text }
                </a>
            );
    }
});

module.exports = Command;
