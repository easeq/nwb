import t from 'prop-types';
import React, { Component } from 'react';
import { Col, Grid, Row } from 'react-bootstrap';

class CherryPicker extends Component {
  render() {
    const { name } = this.props;
    return (
      <Grid>
        <Col>
          <Row>
Go
            {name}
, go go!
          </Row>
        </Col>
      </Grid>
    );
  }
}

CherryPicker.propTypes = {
  name: t.string.isRequired,
};

export default CherryPicker;
