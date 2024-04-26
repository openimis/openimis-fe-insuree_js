import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { INSUREE_PAYMENT_METHOD } from "../constants";

class PaymentMethodPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="insuree"
        label="PaymentMethodPicker"
        constants={INSUREE_PAYMENT_METHOD}
        {...this.props}
      />
    );
  }
}

export default PaymentMethodPicker;
