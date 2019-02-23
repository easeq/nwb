import './Child2.css';

import React, { Component } from 'react';

class Child2 extends Component {
  render() {
    const { routeParams: { site } } = this.props;
    return (
      <div className="Child2">
        <h2>Child 2</h2>
        <img alt="" src="/subdir/shyamalan.jpg" />
        {site && (
        <p>
Site param:
          {site}
        </p>
        )}
      </div>
    );
  }
}

export default Child2;
