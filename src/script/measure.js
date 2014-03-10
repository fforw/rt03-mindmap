/** @jsx React.DOM */

var React = require("react");


var Helper = React.createClass({

    getWidth: function ()
    {
        return this.refs.text.getDOMNode().getComputedTextLength();
    },

    render: function ()
    {
        return (
            React.DOM.svg( {version:"1.1", width:"100", height:"100"},
                React.DOM.g( {className:"node"},
                    React.DOM.text( {ref:"text", x:"0", y:"0"},  this.props.text )
                )
            )
        );
    }
});

function measure(text)
{
    var container, helper;
    container = document.createElement("div");
    container.className = "hidden";

    document.body.appendChild(container);
    helper = React.renderComponent(
        Helper({
            text: text
        }),
        container
    );

    var width = helper.getWidth();

    React.unmountComponentAtNode(container);
    document.body.removeChild(container);

    return width;
}

window.measure = measure;

module.exports = measure;
