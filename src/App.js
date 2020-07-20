import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import Login from './pages/Login';
import PageNotFound from './pages/PageNotFound';
import Student from './pages/Student';
import Educator from './pages/Educator';
import { auth, firestore } from './firebase';

const initialState = {
  ready: false,
  access: null,
  user: null,
  userData: null,
};

function withProps(Component, props) {
  return function(matchProps) {
    return <Component {...props} {...matchProps} />
  }
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = initialState;
  }

  resetState = (callback) => {
    this.setState(
      {
        ready: true,
        access: '',
        user: null,
        userData: null,
      },
      callback,
    );
  };


  render() {
    const { user, access, ready } = this.state;

    if (ready) {
      return (
        <SnackbarProvider>
          <Router>
            <Switch>
              <Route exact path="/" component={withProps(Login, { user: user, access:access })}/>
              <Route path="/student" component={withProps(Student, { user: user, access:access })} />
              <Route path="/educator" component={Educator} />
              <Route path="*" component={PageNotFound} />
            </Switch>
          </Router>
        </SnackbarProvider>
      );
    }
    else return ( "Loading")
  }

  componentDidMount() {
    this.onAuthStateChangedObserver = auth.onAuthStateChanged(
      (user) => {
        if (!user || !user.uid) {
          if (this.userDocumentSnapshotListener) {
            this.userDocumentSnapshotListener();
          }
          this.resetState();
          return;
        }

        this.userDocumentSnapshotListener = firestore
          .collection('users')
          .doc(user.uid)
          .onSnapshot(
            (snapshot) => {
              const data = snapshot.data();

              if (!snapshot.exists || !data) {
                if (this.userDocumentSnapshotListener) {
                  this.userDocumentSnapshotListener();
                }
                this.resetState();
                return;
              }

              this.setState({
                ready: true,
                user: user,
                userData: data,
                access: data.role,
              });

              console.log(this.state)

            },
            (error) => {
              this.resetState();
              return;
            },
          );
      },
      (error) => {
        this.resetState();
        return;
      },
    );
  }

  componentWillUnmount() {
    if (this.onAuthStateChangedObserver) {
      this.onAuthStateChangedObserver();
    }
    if (this.userDocumentSnapshotListener) {
      this.userDocumentSnapshotListener();
    }
  }
}

export default App;
