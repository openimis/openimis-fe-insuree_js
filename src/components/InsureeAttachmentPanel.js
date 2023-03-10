import React, { Component, Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import SaveIcon from "@material-ui/icons/SaveAlt";
import DeleteIcon from "@material-ui/icons/Delete";
import FileIcon from "@material-ui/icons/Add";
import { Button, IconButton, Input, Paper, Grid, Typography, Divider } from "@material-ui/core";
import {
  TextInput,
  FormattedMessage,
  PublishedComponent,
  Table,
  withModulesManager
} from "@openimis/fe-core";

const styles = (theme) => ({
  paper: theme.paper.paper,
  title: theme.paper.title,
  item: theme.paper.item,
});

class InsureeAttachmentPanel extends Component {
  state = {
    open: false,
    claimUuid: null,
    insureeAttachments: [],
    attachmentToDelete: null,
    updatedAttachments: new Set(),
    reset: 0,
  }

  initData = () => {
    let attachments = [];
    if (!!this.props.edited[`attachments`]) {
        attachments = this.props.edited[`attachments`] || [];
    }
    return attachments;
  };

  componentDidMount() {
    this.setState({ insureeAttachments : this.initData() });
  }

  delete = (a, i) => {
    if (!!a.id) {
      this.setState({ attachmentToDelete: a }, (e) =>
        this.props.coreConfirm(
          formatMessage(this.props.intl, "insuree", "deleteInsureeAttachment.confirm.title"),
          formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeAttachment.confirm.message", {
            file: `${a.title} (${a.filename})`,
          }),
        ),
      );
    } else {
      var insureeAttachments = [...this.state.insureeAttachments];
      insureeAttachments.splice(i, 1);
      insureeAttachments.pop();
      this.props.insuree.attachments = [...insureeAttachments];
      insureeAttachments.push({});
      this.setState((state) => ({ insureeAttachments, reset: state.reset + 1 }));
    }
  };

  addAttachment = (document) => {
    let attachment = { ..._.last(this.state.claimAttachments), document };
    if (!!this.state.insureeUuid) {
      this.props.createAttachment(
        { ...attachment, insureeUuid: this.state.insureeUuid },
        formatMessageWithValues(this.props.intl, "insuree", "insuree.InsureeAttachment.create.mutationLabel", {
          file: `${attachment.title} (${attachment.filename})`,
          chfid: `${this.props.insuree.chfid}`,
        }),
      );
    } else {
      if (!this.props.insuree.attachments) {
        this.props.claim.attachments = [];
      }
      this.props.insuree.attachments.push(attachment);
      var insureeAttachments = [...this.state.insureeAttachments];
      insureeAttachments.push({});
      this.setState({ insureeAttachments });
    }
  };

  update = (i) => {
    let attachment = { insureeUuid: this.state.insureeUuid, ...this.state.insureeAttachments[i] };
    this.props.updateAttachment(
      attachment,
      formatMessageWithValues(this.props.intl, "insuree", "insuree.InsureeAttachment.update.mutationLabel", {
        file: `${attachment.title} (${attachment.filename})`,
        chfid: `${this.props.insuree.chfid}`,
      }),
    );
  };

  fileSelected = (f, i) => {
    if (!!f.target.files) {
      const file = f.target.files[0];
      let insureeAttachments = [...this.state.insureeAttachments];
      insureeAttachments[i].filename = file.name;
      insureeAttachments[i].mime = file.type;
      this.setState({ insureeAttachments }, (e) => {
        var reader = new FileReader();
        reader.onloadend = (loaded) => {
          this.addAttachment(btoa(loaded.target.result));
        };
        reader.readAsBinaryString(file);
      });
    }
  };

  formatFileName(a, i) {
    if (!!a.id)
      return (
        <Link onClick={(e) => this.download(a)} reset={this.state.reset}>
          {a.filename || ""}
        </Link>
      );
    if (!!a.filename) return <i>{a.filename}</i>;
    return (
      <IconButton variant="contained" component="label">
        <FileIcon />
        <input type="file" style={{ display: "none" }} onChange={(f) => this.fileSelected(f, i)} />
      </IconButton>
    );
  }

  updateAttachment = (i, key, value) => {
    var state = { ...this.state };
    state.insureeAttachments[i][key] = value;
    state.updatedAttachments.add(i);
    state.reset = state.reset + 1;
    this.setState({ ...state });
  };


  cannotUpdate = (a, i) => i < this.props.insureeAttachments.length - 1 && !!this.props.edited.insureeUuid && !a.id;

  render() {
    const {
      intl,
      classes,
      updateAttribute,
      readOnly = false,
      edited
    } = this.props;
    const { insureeAttachments } = this.state;

    let headers = [
      "insureeAttachment.type",
      "insureeAttachment.title",
      "insureeAttachment.date",
      "insureeAttachment.fileName"
    ];

    let itemFormatters = [
      (a, i) => (
          <TextInput
            reset={this.state.reset}
            value={this.state.insureeAttachments[i].type}
            onChange={(v) => this.updateAttachment(i, "type", v)}
          />
        ),
      (a, i) => (
          <TextInput
            reset={this.state.reset}
            value={this.state.insureeAttachments[i].title}
            onChange={(v) => this.updateAttachment(i, "title", v)}
          />
        ),
      (a, i) =>(
          <PublishedComponent
            pubRef="core.DatePicker"
            onChange={(v) => this.updateAttachment(i, "date", v)}
            value={this.state.insureeAttachments[i].date || null}
            reset={this.state.reset}
          />
        ),
      (a, i) => this.formatFileName(a, i),
    ];
    if (!readOnly) {
      headers.push("claimAttachment.action");
      itemFormatters.push((a, i) => {
        if (!!a.id && this.state.updatedAttachments.has(i)) {
          return (
            <IconButton onClick={(e) => this.update(i)}>
              <SaveIcon />
            </IconButton>
          );
        } else if (i < this.state.insureeAttachments.length - 1) {
          return (
            <IconButton onClick={(e) => this.delete(a, i)}>
              <DeleteIcon />
            </IconButton>
          );
        }
        return null;
      });
    }

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography className={classes.title}>
              <FormattedMessage module="insuree" id="insuree.InsureeFilePanel.title" />
            </Typography>
            <Divider />
            <Table
              module="insuree"
              headers={headers}
              itemFormatters={itemFormatters}
              items={this.state.insureeAttachments}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }
}


export default withModulesManager(withTheme(withStyles(styles)(InsureeAttachmentPanel)));
