import React, { Component } from "react";
import { ConstantBasedLabel } from "@openimis/fe-core";

import { INSUREE_MARITAL_STATUS } from "../constants";

class InsureeMaritalStatusLabel extends Component {
  render() {
    return (
      <ConstantBasedLabel
        module="insuree"
        label="InsureeMaritalStatus"
        constants={INSUREE_MARITAL_STATUS}
        {...this.props}
      />
    );
  }
}

export default InsureeMaritalStatusLabel;
