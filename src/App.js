import React from 'react';
import logo from './logo.svg';
import './App.css';
import SignatureCanvas from 'react-signature-canvas'
import 'react-bootstrap';
import { Modal, Button, Nav, Jumbotron, Form, Row, Col, Container, Card, Image } from 'react-bootstrap';
import PDFViewer from 'pdf-viewer-reactjs';
import Viewer, { Worker } from '@phuocng/react-pdf-viewer';
import '@phuocng/react-pdf-viewer/cjs/react-pdf-viewer.css';
import { useState } from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {show:false, signature:""};

    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleModalShow = this.handleModalShow.bind(this);
    this.signatureAdded = this.signatureAdded.bind(this);
    this.signatureRemoved = this.signatureRemoved.bind(this);
  }

  handleModalShow(e) {
    console.log("Showing Modal");
    this.setState({show:true});
    e.preventDefault();
  }

  handleModalClose() {
    console.log("Closing Modal");
    this.setState({show:false});
  }

  signatureAdded(signature) {
    console.log("SignatureAdded");
    this.setState({signature: signature});
  }

  signatureRemoved() {
    console.log("SignatureRemoved");
    this.setState({signature:""})
  }

  render () {
    return (
      <Container fluid>
        <Row style={{ height: '100vh' }}>
          <Col sm={8}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.4.456/build/pdf.worker.min.js">
                  <div style={{ height: '100vh' }}>
                      <Viewer fileUrl='https://arxiv.org/pdf/quant-ph/0410100.pdf' />
                  </div>
              </Worker>
          </Col>
          <Col sm={4}>
            <SignaturePanel showModal={this.handleModalShow} signature={this.state.signature}/>
          </Col>
        </Row>

        <SignatureModal show={this.state.show} onHide={this.handleModalClose}
        signatureAdded={this.signatureAdded} signatureRemoved={this.signatureRemoved}
        signature={this.state.signature}/>
        </Container>
    );
  }
}

class SignaturePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const headerElement = this.props.signature ? (<h1 class="display-4">Document Signed</h1>) :
    (<h1 class="display-4">Sign this document</h1>);
    return (
    <Jumbotron style={{height: '100vh'}}>
      {headerElement}
      <p class="lead">By signing this document, you agree to eveything stated in this document.</p>
      <hr class="my-4" />
      <SignatureForm 
        showModal={this.props.showModal} signature={this.props.signature}
      />
    </Jumbotron>
    )
  }
}

class SignatureForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: "", date:"2020-07-22"};

    this.updateName = this.updateName.bind(this);
  }

  updateName(e) {
    this.setState({name: e.target.value});
  }

  render() {
    console.log(this.props.signature);
    const signature = this.props.signature ?
          (<Form.Group>
            <Form.Label>Signature</Form.Label>
            <Image fluid src={this.props.signature} rounded />
          </Form.Group>) :
          (<Button type="submit" variant="primary" onClick={this.props.showModal} disabled={!this.state.name}>Sign now</Button>);
    return (
      <Form>
        <Form.Group>
          <Form.Label>Full name</Form.Label>
          <Form.Control 
            type="text" placeholder="Full Name" 
            value={this.state.name} onChange={this.updateName}
            disabled = {this.props.signature}
            />
        </Form.Group>
        <Form.Group>
          <Form.Label>Date</Form.Label>
          <Form.Control type="date" value={this.state.date} disabled/>
        </Form.Group>
        {signature}
      </Form>
    )
  }
}

class SignatureModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.onHide} size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered>
        <Modal.Header closeButton>
          <Modal.Title>Choose a method to sign</Modal.Title>
        </Modal.Header>
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link>Draw</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="link-1">Type</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="disabled" disabled>
              Mobile
            </Nav.Link>
          </Nav.Item>
        </Nav>
        <Modal.Body><DrawModalView addSignature={this.props.signatureAdded} removeSignature={this.props.signatureRemoved}/></Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={this.props.onHide} disabled={!this.props.signature}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

class DrawModalView extends React.Component {
  constructor(props) {
    super(props);
    this.sigCanvas = null;

    this.clearCanvas = this.clearCanvas.bind(this);
    this.handleSignatureAdded= this.handleSignatureAdded.bind(this);
  }

  clearCanvas() {
    this.props.removeSignature();
    this.sigCanvas.clear();
  }

  handleSignatureAdded(signature) {
    console.log(signature);
    this.props.addSignature(signature);
  }

  render() {
    return (
          <Card className="text-center" border="light">
            <Card.Body>
              <Card.Title>Draw your signature in the box:</Card.Title>
              <SignatureCanvas 
                ref={(ref) => this.sigCanvas = ref}
                penColor='black'
                canvasProps={{width: 500, height: 200, className: 'sigCanvas'}}
                backgroundColor="rgba(0,0,0,0.05)" 
                onEnd={() => this.handleSignatureAdded(this.sigCanvas.toDataURL())}
              />
              <br/>
              <Button variant="link" onClick={this.clearCanvas}>Clear</Button>
            </Card.Body>
          </Card>
    )
  }
}

export default App;
