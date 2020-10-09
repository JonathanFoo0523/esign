import React, { useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import SignatureCanvas from 'react-signature-canvas'
import { Modal, Button, Nav, Jumbotron, Form, Row, Col, Container, Card, Image, Navbar, Pagination
, Spinner, Accordion, ListGroup, Badge, FormGroup, AccordionCollapse, AccordionToggle } from 'react-bootstrap';
import { Document, Page, pdfjs } from "react-pdf";
import Viewer, { Worker } from '@phuocng/react-pdf-viewer';
import '@phuocng/react-pdf-viewer/cjs/react-pdf-viewer.css';
import html2canvas from 'html2canvas';
import throttle from 'lodash.throttle';
import queryString from 'query-string'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {numPages:null, pageNumber:1, showDetailModal:false, showSignatureModal:false};
    this.handleDetailModalClose = this.handleDetailModalClose.bind(this);
    this.handleDetailModalShow = this.handleDetailModalShow.bind(this);
    this.handleSignatureModalShow = this.handleSignatureModalShow.bind(this);
    this.handleSignatureModalClose = this.handleSignatureModalClose.bind(this);
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.previousPage = this.previousPage.bind(this);
    this.nextPage = this.nextPage.bind(this);

    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

    let search = window.location.search;
    let params = new URLSearchParams(search);
    this.user = {};
    this.user.full = search; 
    this.user.repoId = params.get('repo_id');
    this.user.taskUid = params.get('task_uid');
    this.user.workflowUid = params.get('workflow_uid');
    this.user.secToken = params.get('secToken');
  }

  handleDetailModalShow(e) {
    this.setState({showDetailModal:true});
    e.preventDefault();
  }

  handleDetailModalClose() {
    this.setState({showDetailModal:false});
  }

  handleSignatureModalShow(e) {
    this.setState({showSignatureModal:true});
    e.preventDefault();
    console.log("Access Code initiated");
    fetch("http://localhost:8080/esign-mobile/createAccessCode" + this.user.full);
  }

  handleSignatureModalClose() {
    this.setState({showSignatureModal:false});
  }

  onDocumentLoad = ({ numPages }) => {
    this.setState({ numPages:numPages });
  }

  previousPage = () => {
    this.setState({pageNumber:this.state.pageNumber - 1});
  }

  nextPage = () => {
    this.setState({pageNumber:this.state.pageNumber + 1});
  }

  render() {
    return (
      <>
        <style type="text/css">
          {`
          @media (max-width: 576px) {
            .navbar-nav {
              text-align: center;
            }

            .btn-nav {
              display: block;
              width:100%;
            }
          }
          `}
        </style>
        <Navbar expand="sm" variant="light" bg="light">
          <Navbar.Brand>Esign</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="http://localhost:8080/esign-mobile/pdfContent">Download</Nav.Link>
            <Nav.Link onClick={this.handleDetailModalShow}>Detail</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link><Button className="btn-nav" variant="outline-danger" size="sm">Reject</Button></Nav.Link>
            <Nav.Link><Button onClick={this.handleSignatureModalShow} className="btn-nav" variant="outline-success" size="sm">Sign</Button></Nav.Link>
          </Nav>
          </Navbar.Collapse>
        </Navbar>

        <div ref={this.myInput}>
        <Document
          file={"http://localhost:8080/esign-mobile/pdfContent" + this.user.full}
          onLoadSuccess={this.onDocumentLoad}
          width={this.state.PDFWidth}
        >
          <Page pageNumber={this.state.pageNumber} />
        </Document>
        </div>

        <Pagination>
          <Pagination.Prev onClick={this.previousPage} disabled={this.state.pageNumber <= 1}/>
          <Pagination.Item disabled>Page {this.state.pageNumber || (this.state.pageNumber ? 1 : '--')} of {this.state.numPages || '--'}</Pagination.Item>
          <Pagination.Next disabled={this.state.pageNumber >= this.state.numPages} onClick={this.nextPage}/>
        </Pagination>

      <DetailModal show={this.state.showDetailModal} onHide={this.handleDetailModalClose} user={this.user}/>
      <SignatureModal show={this.state.showSignatureModal} onHide={this.handleSignatureModalClose}
        signatureAdded={this.signatureAdded} signatureRemoved={this.signatureRemoved}
        signature={this.state.signature} user={this.user}/>
      </>
      
    );
  }
}

class DetailModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isLoaded:false, result:null}

    this.getEsignDetail = this.getEsignDetail.bind(this);
    this.signatoriesStatus = this.signatoriesStatus.bind(this);
  }

  getEsignDetail() {
    console.log("Request sent");
    fetch("http://localhost:8080/esign-mobile/esignDetail" + this.props.user.full)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          isLoaded:true,
          result: data,
        });
        console.log(this.state.result.success);
      });
  }

  componentDidMount() {
    this.getEsignDetail();
  }

  signatoriesStatus(id) {
    switch(id) {
      case 0:
        return {badge:"secondary", status:"Not Started"};
      case 1:
        return {badge:"primary", status:"Started"}
      case 3:
        return {badge:"success", status:"Signed"}
    }
  }

  render() {
    var body = null;

    if (this.state.result == null) {
      body = (<Card className="text-center">
                <Card.Body>
                  <Card.Title>Loading...</Card.Title>
                  <Card.Text>
                    <Spinner animation="border" />
                  </Card.Text>
                </Card.Body>
              </Card>);
    } else {
      body = (<Accordion defaultActiveKey="0">
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey="0">
          E-signature Workflow Detail
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
          <dl class="row">
            <dt class="col-sm-5">Record Number</dt>
            <dd class="col-sm-7">{this.state.result.results.node_record_number}</dd>

            <dt class="col-sm-5">Record Title</dt>
            <dd class="col-sm-7">{this.state.result.results.node_title}</dd>

            <dt class="col-sm-5">Status</dt>
            <dd class="col-sm-7">{this.state.result.results.is_task_started}</dd>

            <dt class="col-sm-5">Initiator</dt>
            <dd class="col-sm-7">{this.state.result.results.initiator_name}</dd>

            <dt class="col-sm-5">Start Date</dt>
            <dd class="col-sm-7">{this.state.result.results.start_date}</dd>

            <dt class="col-sm-5">Completed Date</dt>
            <dd class="col-sm-7">{this.state.result.results.end_date == "" ? "-" : this.state.result.results.end_date}</dd>
          </dl>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey="1">
          Signatories
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="1">
          <ListGroup variant="flush">
            {this.state.result.results.tasks.map(task => (
              <ListGroup.Item>
                <Container fluid>
                  <Row className="align-items-center">
                    <Col md={9}>
                      <Card.Title>{task.signatory_name}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">{task.signatory_email}</Card.Subtitle>
                    </Col>
                    <Col md={3}>
                      <Badge pill variant={this.signatoriesStatus(task.status).badge}>
                        {this.signatoriesStatus(task.status).status}
                      </Badge>
                    </Col>
                  </Row>
                </Container>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Accordion.Collapse>
      </Card>
    </Accordion>);
    }
    return (
      <>
      <style type="text/css">{`
        @media (max-width: 576px) {
          .modal-dialog {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          .modal-content {
            height: auto;
            min-height: 100%;
            border-radius: 0;
          }

          .modal-dialog-scrollable{
            display: flex;
            max-height: 100%;
          }
        }
      `}
      </style>
      <Modal scrollable show={this.props.show} onHide={this.props.onHide} size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered>
        <Modal.Header>
          <Modal.Title>Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {body}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={this.props.onHide}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    )
  }
}

class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {show:false, signature:""};

    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleModalShow = this.handleModalShow.bind(this);
    this.signatureAdded = this.signatureAdded.bind(this);
    this.signatureRemoved = this.signatureRemoved.bind(this);
  }

  handleModalShow(e) {
    this.setState({show:true});
    e.preventDefault();
  }

  handleModalClose() {
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
    this.state = {name: "", date:"2020-08-17"};

    this.updateName = this.updateName.bind(this);
  }

  updateName(e) {
    this.setState({name: e.target.value});
  }

  render() {
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
    this.state = {signature:"", esignStep:0, accessCode:"", confirmation:false}

    this.signatureAdded = this.signatureAdded.bind(this);
    this.signatureRemoved = this.signatureRemoved.bind(this);
    this.updateAccessCode = this.updateAccessCode.bind(this);
    this.updateSignature = this.updateSignature.bind(this);
    this.handlePrimaryButtonSelected = this.handlePrimaryButtonSelected.bind(this);
    this.handleSecondaryButtonSelected = this.handleSecondaryButtonSelected.bind(this);
    this.confirmationChanged = this.confirmationChanged.bind(this);
  }

  signatureAdded(signature) {
    this.setState({signature: signature});
  }

  signatureRemoved() {
    console.log("SignatureRemoved");
    this.setState({signature:""})
  }

  updateAccessCode(e) {
    this.setState({accessCode:e.target.value});
  }

  updateSignature(signature) {
    this.setState({signature:signature});
  }

  handlePrimaryButtonSelected(e) {
    console.log("Handling Primary Button selected")
    switch(this.state.esignStep) {
      case 0:
        this.setState({esignStep:1});
        break;
      case 1:
        this.setState({esignStep:2});
        break;
    }
  }

  handleSecondaryButtonSelected(e) {
    this.setState({esignStep: this.state.esignStep - 1});
    if(this.state.esignStep == 2) {this.setState({confirmation:false})}
  }

  confirmationChanged(e) {
    this.setState({confirmation: !this.state.confirmation});
  }

  render() {
    let cardView = null;
    let footerView = null;
    switch(this.state.esignStep) {
      case 0:
        cardView = <AccessCodeCardView onUpdate={this.updateAccessCode} accessCode={this.state.accessCode}/>;
        footerView = <Button variant="primary" onClick={this.handlePrimaryButtonSelected} disabled={!this.state.accessCode}>Next</Button>
        break;
      case 1:
        cardView = <SignCardView onUpdate={this.updateSignature} user={this.props.user}/>;
        footerView = (<><Button variant="secondary" onClick={this.handleSecondaryButtonSelected}>Previous</Button>
                    <Button variant="primary" onClick={this.handlePrimaryButtonSelected} disabled={!this.state.signature}>Next</Button></>);
        break;
      case 2:
        cardView = <ConfirmationCardView signature={this.state.signature} accessCode={this.state.accessCode} confirmationChanged={this.confirmationChanged}/>;
        footerView = (<><Button variant="secondary" onClick={this.handleSecondaryButtonSelected} confirmationChanged={this.confirmationChanged}>Previous</Button>
                      <Button variant="warning" onClick={this.props.handlePrimaryButtonSelected} disabled={!this.state.confirmation}>E-Sign</Button></>);
        break;
    }
    return (
      <>
      <style type="text/css">{`
      @media (max-width: 576px) {
        .modal-dialog {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        .modal-content {
          height: auto;
          min-height: 100%;
          border-radius: 0;
        }

        .modal-dialog-scrollable{
          display: flex;
          max-height: 100%;
        }
      }
    `}
    </style>
      <Modal show={this.props.show} onHide={this.props.onHide} size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cardView}
        </Modal.Body>
        <Modal.Footer>
          {footerView}
        </Modal.Footer>
      </Modal>
      </>
    )
  }
}

class AccessCodeCardView extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Card>
        <Card.Header>Enter Access Code</Card.Header>
        <Card.Body>
          <Card.Text>An access code has been sent to your mailbox.<br/>
            Please enter the access code to E-Sign this document.<br/>
            If you can not see the email please check your Junk/Spam Box.
          </Card.Text>
          <Form>
            <Form.Group>
              <Form.Label>Access Code:</Form.Label>
              <Form.Control type="password" onChange={this.props.onUpdate} value={this.props.accessCode}/>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    )
  }
}

class ConfirmationCardView extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <Card border="warning">
            <Card.Header>Confirmation</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Access Code</Form.Label>
                  <Form.Control type="number" placeholder="Enter email" value={this.props.accessCode} disabled/>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Signature</Form.Label>
                  <Image style={{background: "rgba(0,0,0,0.05)"}}fluid src={this.props.signature} rounded />
                </Form.Group>
                <Form.Group>
                  <Form.Check type="checkbox" label="I confirm to E-Sign this document." onChange={this.props.confirmationChanged}/>
                </Form.Group>
              </Form>
            </Card.Body>
        </Card>
    )
  }
}

class SignCardView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {method:"History"};

    this.handleChangeMethod = this.handleChangeMethod.bind(this);
  }

  handleChangeMethod(newMethod) {
    this.setState({method:newMethod});
    this.props.onUpdate("");
  }

  render() {
    let methodView = null;
    
    switch(this.state.method) {
      case "History":
        methodView = <HistoryModalView updateSignature={this.props.onUpdate} user={this.props.user}/>;
        break;
      case "Draw":
        methodView = <DrawModalView updateSignature={this.props.onUpdate}/>;
        break;
      case "Type":
        methodView = <TypeModalView updateSignature={this.props.onUpdate}/>;
        break;
      case "Take Photo":
        methodView = <UploadModelView />;
        break;
      case "Mobile":
        methodView = <MobileModalView updateSignature={this.props.onUpdate}/>;
        break;
    }

    return (
      <>
      <Modal.Title>Choose your signature</Modal.Title>
      <br/>
      <Card className="text-center">
      <Card.Header><CardNavBar changeMethod={this.handleChangeMethod} currentMethod={this.state.method}/></Card.Header>
      <Card.Body>
        {methodView}
      </Card.Body>
      </Card>
      </>
    )
  }
}

class CardNavBar extends React.Component {
  constructor(props) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(key) {
    this.props.changeMethod(key);
  }

  render() {
    return (
      <Nav justify variant="pills" activeKey={this.props.currentMethod} onSelect={this.handleSelect}>
          <Nav.Item>
            <Nav.Link eventKey="History">History</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="Draw">Draw</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="Type">Type</Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey="Mobile">Mobile</Nav.Link>
          </Nav.Item>
        </Nav>
    )
  }
}

class HistoryModalView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {signature:""};
    this.getSavedSignature = this.getSavedSignature.bind(this);
  }

  getSavedSignature() {
    console.log('called');
    fetch("http://localhost:8080/esign-mobile/savedSignature?full=" + this.props.user.full)
      .then(response => response.text())
      .then(data => {
        console.log(data);
        this.setState({signature:"http://localhost:8080/esign-mobile/savedSignature" + this.props.user.full});
        this.props.updateSignature(this.state.signature);
      });
  }

  componentDidMount() {
    console.log("Component Did Mount");
    this.getSavedSignature();
  }

  render() {
    console.log(this.state.signature);
    const content = this.state.signature ? <Image fluid src={this.state.signature} rounded /> : <p>No save signature</p>
    return(
        <>{content}</>
    )
  }
}

class DrawModalView extends React.Component {
  constructor(props) {
    super(props);
    this.sigCanvas = null;
    this.state = {canvasWidth:null};

    this.clearCanvas = this.clearCanvas.bind(this);
    this.handleSignatureAdded= this.handleSignatureAdded.bind(this);
    this.cardTitle = React.createRef();
  }

  setCanvasWidth = () => {
    const width = this.cardTitle.current.offsetWidth;
    this.setState({canvasWidth:width});
    console.log(width);
  }

  componentDidMount() {
    this.setCanvasWidth();
    window.addEventListener('resize', throttle(this.setCanvasWidth, 500))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', throttle(this.setCanvasWidth, 500))
  }

  clearCanvas() {
    this.props.updateSignature("");
    this.sigCanvas.clear();
  }

  handleSignatureAdded(signature) {
    console.log(signature);
    this.props.updateSignature(signature);
  }

  render() {
    return (
      <>
      <style type="text/css">
        {`
        .sigCanvas {
          background: rgba(0,0,0,0.05)
        }
        `}
      </style>
          <Card.Title ref={this.cardTitle}></Card.Title>
          <SignatureCanvas 
            ref={(ref) => this.sigCanvas = ref}
            penColor='black'
            canvasProps={{width: this.state.canvasWidth, height: 200, className: 'sigCanvas'}}
            onEnd={() => this.handleSignatureAdded(this.sigCanvas.toDataURL())}
          />
          <br/>
          <Button variant="link" onClick={this.clearCanvas}>Clear</Button>
      </>
    )
  }
}

class TypeModalView extends React.Component {
  constructor(props) {
    super(props);
    this.availableFontFamily = ['Tangerine', 'Dancing Script', 'Nothing You Could Do', 'Herr Von Muellerhoff', 'Kristi', 
      'Arizonia', 'Rouge Script', 'Mr De Haviland', 'Mrs Saint Delafield',
      'Sacramento', 'Shadows Into Light Two'];
    this.state = {fontSize: 100, fontFamilyIndex: 0, signature:"", canvasWidth:null};
    this.signaturePad = React.createRef();

    this.handleFontSizeChange = this.handleFontSizeChange.bind(this);
    this.handleSignatureChange = this.handleSignatureChange.bind(this);
    this.handleFontFamilyChange = this.handleFontFamilyChange.bind(this);
    this.getImageURL = this.getImageURL.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.cardTitle = React.createRef();
  }

  /*
  componentDidMount() {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 40px KaiTi";
    ctx.fillText("Jonathan FJJ",250,100);
  }
  */
  async getImageURL() {
    const canvas = await html2canvas(this.signaturePad.current, {backgroundColor:"#ffff00"});
    return canvas.toDataURL();
  }
  
  async handleFontSizeChange(e) {
    let value = e.target.value;
    await this.setState({fontSize:value});
    if (this.state.signature === "") {return;}
    this.handleChange();
  }

  async handleSignatureChange(e) {
    await this.setState({signature:e.target.value});
    console.log("Current Signature Value");
    console.log(this.state.signature);
    await this.handleChange();
    if (this.state.signature === "") {
      this.props.updateSignature("");
      return;
    }
  }

  async handleFontFamilyChange() {
    let curIndex = this.state.fontFamilyIndex;
    if (curIndex == this.availableFontFamily.length - 1) {
      curIndex = 0;
    } else {
      curIndex += 1;
    }
    await this.setState({fontFamilyIndex:curIndex});
    if (this.state.signature === "") {return;}
    this.handleChange();
  }

  async handleChange() {
    const imageURL = await html2canvas(this.signaturePad.current).then(canvas => {
      this.props.updateSignature(canvas.toDataURL());
    })
  }

  setCanvasWidth = () => {
    const width = this.cardTitle.current.offsetWidth;
    this.setState({canvasWidth:width});
    console.log(width);
  }

  componentDidMount() {
    this.setCanvasWidth();
    window.addEventListener('resize', throttle(this.setCanvasWidth, 500))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', throttle(this.setCanvasWidth, 500))
  }

  render() {
    const textStyle = {
      fontFamily: this.availableFontFamily[this.state.fontFamilyIndex],
      fontSize: this.state.fontSize + "px",
      width: this.state.canvasWidth + "px",
      height: this.state.canvasWidth / 5 * 2 + "px"
    };

    return (
      <>
      <Card.Title ref={this.cardTitle}></Card.Title>
        <input ref={this.signaturePad} type="text" class="Signature-Input" style={textStyle}
        placeholder="Signature" onChange={this.handleSignatureChange}
        value={this.state.signature}/>
        <br/>
        <Container>
        <Row className="justify-content-md-center">
          <Col md="auto">
          <Button variant="outline-secondary" onClick={this.handleFontFamilyChange}>Change Font</Button>
          </Col>
          <Col xs lg="2">
            <Form.Control type="number" min="50" max="200" 
              onChange={this.handleFontSizeChange} value={this.state.fontSize}
            />
          </Col>
        </Row>
        </Container>
      </>
    );
  }
}

class MobileModalView extends React.Component {
  constructor(props) {
    super(props);

    this.getSignature = this.getSignature.bind(this);
    this.state = {signature:""};
    
    this.handleRetry = this.handleRetry.bind(this);
    this.handleSignatureAdded = this.handleSignatureAdded.bind(this);
  }

  getSignature() {
    fetch("http://192.168.0.158:8080/esign-mobile/Glue?sessionid=001")
        .then(response => response.text())
        .then(data => {
          if (data === "No signature") {
            console.log("No signature yet");
          } else {
            console.log(data);
            clearInterval(this.interval);
            this.setState({signature:data});
            this.handleSignatureAdded(this.state.signature);
          }
        });
  }

  componentDidMount() {
    console.log("Component Did Mount");
    this.interval = setInterval(this.getSignature, 500);
  }

  componentWillUnmount() {
    console.log("Component Will Unmount");
    clearInterval(this.interval);
  }

  handleSignatureAdded(signature) {
    console.log(signature);
    this.props.updateSignature(signature);
  }

  handleRetry() {
    this.setState({signature:""});
    this.props.updateSignature("");
    this.interval = setInterval(this.getSignature, 2000);
  }
  
  render() {
    const title = this.state.signature ? "Signature from your mobile:" : "Scan the QR Code with your mobile device"
    const presentImage = this.state.signature ? 
                    <Image src={this.state.signature} width={500} height={200} rounded /> :
                    <Image src="http://localhost:8080/esign-mobile/DisplayQRCode?sessionid=001" height={200} rounded />;
    const description = this.state.signature ?
                          <Button variant="link" onClick={this.handleRetry}>Retry</Button> :
                          <Card.Text>After scanning, follow the instruction on screen.<br/>
                            The screen will refresh upon completion.</Card.Text>;              
      
    return (
        <>
        <Card.Title>{title}</Card.Title>
        {presentImage}
        <br/>
        {description}
        </>

    )
  }
}

class UploadModelView extends React.Component {
  constructor(props) {
    super(props);

    this.upload = this.upload.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  upload() {
    document.getElementById("selectImage").click()
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("1234");
  };

  render() {
    return(
      <Card className="text-center" border="light">
            <Card.Body style={{height:'320px'}}>
            <Card.Title>Upload phtoto of your signature</Card.Title>
              <input id='selectImage' type="file" accept="image/*" style={{display:'none',border: 'dashed'}} />
              <Container style={{width:'500px', height:'200px', border:'1px dashed #bdbdbd'}} onDrop={this.handleDrop}>
                <br/>
                <p>Choose one of the method:</p>
                <Card.Text><Button variant="outline-secondary" onClick={this.upload}>Browse File</Button></Card.Text>
                <Card.Text><Button variant="outline-secondary" onClick={this.upload}>Take Photo</Button></Card.Text>
              </Container>
              <Card.Text>Maximum file size: 40MB<br />
                Acceptable file formats: png, jpg, jpeg, bmp, gif</Card.Text>
            </Card.Body>
          </Card>
    )
  }
}

export default App;
