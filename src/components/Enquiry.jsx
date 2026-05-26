import React, { useState, useRef } from "react";
import { injectIntl } from "react-intl";
import { alpha } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import clsx from "clsx";
import { InputBase } from "@mui/material";

import { GetIconComponent, formatMessage } from "@openimis/fe-core";
import EnquiryDialog from "./EnquiryDialog";
import { INSUREE_NUMBER_MAX_LENGTH } from "../constants";
const SearchIcon = GetIconComponent("Search")
const StyledEnquiry = styled('div')(({ theme }) => ({
  '& .search': {
    position: "relative",
    borderRadius: theme?.shape?.borderRadius ?? 4,
    backgroundColor: alpha(theme?.palette?.common?.white ?? "#fff", 0.15),
    "&:hover": {
      backgroundColor: alpha(theme?.palette?.common?.white ?? "#fff", 0.25),
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme?.spacing ? theme.spacing(1) : 8,
      width: "auto",
    },
  },
  '& .searchIcon': {
    width: theme?.spacing ? theme.spacing(7) : 56,
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  '& .inputRoot': {
    color: "inherit",
  },
  '& .inputInput': {
    padding: theme?.spacing ? theme.spacing(1, 1, 1, 7) : "8px 8px 8px 56px",
    transition: theme?.transitions?.create ? theme.transitions.create("width") : "width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: 120,
      "&:focus": {
        width: 200,
      },
    },
  },
  '& .inputLarge': {
    width: 200,
  },
}));

const Enquiry = (props) => {
  const { intl, ...others } = props;
  const [chfid, setChfid] = useState(null);
  const inputRef = useRef();

  const handleKeyPress = (event) => {
    if (event.charCode === 13 && event.target.value) {
      setChfid(event.target.value);
    } else {
      const value = event.target.value;
      const charCode = event.charCode;
      const isAlphaNumeric = /^[a-zA-Z0-9]*$/.test(value + String.fromCharCode(charCode));
      const isLengthValid = value.length < INSUREE_NUMBER_MAX_LENGTH || charCode === 50;
      if (!isAlphaNumeric || !isLengthValid) {
        event.preventDefault();
        return;
      }
    }
  };

  const handleClose = () => {
    setChfid(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <StyledEnquiry>
      <div className="search">
        <EnquiryDialog open={Boolean(chfid)} chfid={chfid} onClose={handleClose} {...others} />
        <div className="searchIcon">
          <SearchIcon />
        </div>
        <InputBase
          name="enquiryField"
          inputRef={inputRef}
          placeholder={formatMessage(intl, "insuree", "appBar.enquiry")}
          classes={{
            root: "inputRoot",
            input: clsx("inputInput", Boolean(chfid) && "inputLarge"),
          }}
          onKeyPress={handleKeyPress}
        />
      </div>
    </StyledEnquiry>
  );
};

export { StyledEnquiry };
export default injectIntl(Enquiry);
