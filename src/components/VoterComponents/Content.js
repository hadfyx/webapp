import React from "react";
import Header from "../Header";
import Election from "./Election";
import NavBar from "./NavBar";
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import ElectionList from "./ElectionList";
import ElectionResults from "./ElectionResults";
import UpcommingElections from "./UpcommingElections";
import * as Servers from "../settings";
import moment from "moment";
import Cookies from 'js-cookie';


class Content extends React.Component {
  constructor(props) {
    super(props);

    this.name = Cookies.get("name");
    
    var urlRoute = this.props.location.pathname;
    this.type = urlRoute.substr(urlRoute.lastIndexOf('/') + 1);


    this.state = {
      voterId: this.props.voterId,
      electionType: this.type,
      loading: ""
    };
    this.currentIndex = 0;
  }

  // preform a fetch request to retrieve all current ballots
  componentWillMount(props) {

    // if not logged in, return
    if(!this.name){
      return;
    }
    
    if (this.type === "Upcomming Elections") {
      this.getElections("upcomming");
    } else if (this.type === "Past Elections") {
      this.getElections("past");
    } else if (this.type === "Current Elections") {
      this.getElections("current");
    }
    
  }

  componentDidUpdate(prevProps){
    // check for url updates here
    if (this.props.location !== prevProps.location) {
      var urlRoute = this.props.location.pathname;
      this.type = urlRoute.substr(urlRoute.lastIndexOf('/') + 1);
   
      this.titles = [];
      this.dates = [];
      this.setState({
        electionType: this.type,
        electionIds: []
      });

      if (this.type === "Upcomming Elections") {
        this.getElections("upcomming");
      } else if (this.type === "Past Elections") {
        this.getElections("past");
      } else if (this.type === "Current Elections") {
        this.getElections("current");
      }
    }
  }

  // preforms requests to get a list of election ids
  // date can either be "current" , "past" , or "upcomming"
  getElections = date => {
    var url = Servers.API_SERVER + "election/" + date;
    this.setState({
      loading: <div className="loading" />
    });
    console.log(url);
    fetch(url)
      .then(response => {
        return response.json();
      })
      .then(json => {
        var elections = json[0];
        //console.log(json);
        var electionIds = [];
        for (var i = 0; i < elections.length; i++) {
          var eId = elections[i].electionId;
          electionIds.push(eId);
        }
        if (elections[0] && elections[0].organizer) {
          this.dates = [];
          this.organizers = [];
          for (var i = 0; i < elections.length; i++) {
            // get all necessary dates
            var start = elections[i].startDate;
            var end = elections[i].endDate;
            var date = this.formatDate(start, end);
            this.dates.push(date);

            //get all organizers
            var org = elections[i].organizer;
            this.organizers.push(org);
          }
        }
        this.setState({
          electionIds: electionIds, //array of elections
          selectedElection: electionIds[0], // index of the current selected election, starts with the first election created
          loading: ""
        });
      });
  };

  formatDate = (start, end) => {
    var s = moment(start);
    var e = moment(end);
    return s.format("MMMM Do YYYY") + " - " + e.format("MMMM Do YYYY");
  };

  /*
     * select is the event handler in the ElectionList child component
     * the election list presents a list of clickable elections, clicking on another election
     * would render a new election with different propositions on the right of the list
     * 
     * This is for the current elections tab
     */
  selectElection = (newElection, index) => {
    this.currentIndex = index;
    this.setState({
      selectedElection: newElection
    });
  };

  /**
   *  function called when one of the options on the navigation bar on type is clicked
   */
  selectType = type => {
    if (this.state.electionType !== type) {
      // this below changes the url
      this.props.history.push('/voter/' + type)
    }
  };

  voteHandler = (index, selection) => {
    this.markedBallots[index] = true;
    this.answers[index] = selection;
  };

  renderCurrentElections = () => {
    return (
      <div>
        <Header name={this.name} />
        <NavBar selectType={this.selectType} 
           electionType = {this.state.electionType}
        />
        <div className="section">
          <div className="columns">
            <div className="column is-4">
              <ElectionList
                title={this.state.electionType}
                selectedElection={this.selectElection}
                list={this.state.electionIds}
              />
              {this.state.loading}
            </div>
            <div className="column is-8">
              <Election
                key={"current"}
                voter={this.name}
                index={this.currentIndex}
                election={this.state.selectedElection}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderUpComingElections = () => {
    return (
      <div>
        <Header name={this.name} />
        <NavBar selectType={this.selectType} 
        electionType = {this.state.electionType}/>
        <div className="section">
          <div className="panel-block">
            <p className="control has-icons-left">
              <input
                className="input is-small"
                type="text"
                placeholder="search"
              />
              <span className="icon is-small is-left">
                <i className="fa fa-search" />
              </span>
            </p>
          </div>
        </div>
        <UpcommingElections
          titles={this.state.electionIds}
          dates={this.dates}
          organizations={this.organizers}
        />
      </div>
    );
  };

  renderPastElections = () => {
    return (
      <div>
        <Header name={this.name} />
        <NavBar selectType={this.selectType} 
        electionType = {this.state.electionType}/>
        <div className="section">
          <div className="columns">
            <div className="column is-4">
              <ElectionList
                title={this.state.electionType}
                selectedElection={this.selectElection}
                list={this.state.electionIds}
              />
              {this.state.loading}
            </div>
            <div className="column is-8">
              <ElectionResults election={this.state.selectedElection} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    //check to make sure user has logged in 
    if(!this.name){
      return  <Redirect to="/"/>
    }

    // make sure user is a voter
    var type = Cookies.get('type');
    if(!type || type != 1 )
    {
      return  <Redirect to="/"/>
    }

    if (this.state.electionType === "Current Elections") {
      return this.renderCurrentElections();
    } else if (this.state.electionType === "Upcomming Elections") {
      return this.renderUpComingElections();
    } else if (this.state.electionType === "Past Elections") {
      return this.renderPastElections();
    }
  }
}

export default Content;