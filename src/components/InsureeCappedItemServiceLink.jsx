import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { Link, Grid } from "@mui/material";
import { FormattedMessage } from "@openimis/fe-core";

const StyledInsureeCappedItemServiceLink = styled('div')(({ theme }) => ({
  '& .lnk': {
    textAlign: "center",
  },
}));

class InsureeCappedItemServiceLink extends Component {
  render() {
    const { insuree } = this.props;
    return (
      <StyledInsureeCappedItemServiceLink>
        <Grid size={12} className="lnk">
          <Link href={`${process.env.PUBLIC_URL || ""}/insuree/cappedItemService?nshid=${insuree.chfId}`}>
            <FormattedMessage module="insuree" id="link.cappedItemService" />
          </Link>
        </Grid>
      </StyledInsureeCappedItemServiceLink>
    );
  }
}

const mapStateToProps = (state) => ({
  insuree: state.insuree.insuree,
});

export { StyledInsureeCappedItemServiceLink };
export default injectIntl(connect(mapStateToProps)(InsureeCappedItemServiceLink));
