var gen_tools = {} ;

const audienceView = {
    init: class init extends React.Component { //init audience view
        constructor() {
            super()
            //set initial values
            this.state = {
                showUsers:true,
                loading:false,
                users: []
            }
            //bind this to functions
            this.getAudience = this.getAudience.bind(this)
            this.deleteUser = this.deleteUser.bind(this)
            this.renderUser = this.renderUser.bind(this)
        }

        componentDidMount() {
            //get all users
            this.getAudience(()=>{
                //load timezone & countries
                this.loadTimezoneCountries() ;
            })
        }

        getAudience = (callback) =>{
            let _url = admin_dashboard.servername + "adminbot/getfanpageusers/";
            audienceView.fetchPost(_url, {fanpage: admin_dashboard.fanpage, token: admin_dashboard.token}, (accountUsers) =>{
                // console.log("here we are...")
                console.log(accountUsers)
                //set users
                this.setState({
                    users:accountUsers
                })
                callback()
            })
        }

        loadTimezoneCountries = () =>{
            async.series([
                function loadCountries(callback){
                    $.getJSON("/javascripts/timezones.json", function(timezones) {
                        // console.log("timezones ", timezones);
                        admin_dashboard.timezones = timezones ;
                        callback(null) ;
                    });
                },
                function loadTimeZones(callback){
                    $.getJSON("/javascripts/countries.json", function(countries) {
                        // console.log("countries ", countries);
                        admin_dashboard.countries = countries ;
                        callback(null) ;
                    });
                }
            ], function(err, results){
                // callback()
            })
        }

        renderUser = (user) =>{
            //set show users
            this.setState({
                showUsers:false,
                user:user
            })
        }

        deleteUser = (user) =>{
            //delete user
            // debugger
            this.setState({loading:true})
            let _url = admin_dashboard.servername + "adminbot/removeuser/";
            audienceView.fetchPost(_url, {fanpage: admin_dashboard.fanpage, fbid: user._id}, (res) =>{
                //get users after deletion
                this.getAudience(()=>{
                    this.setState({loading:false})
                })
            })
        }

        render() {
            return (
                <div className="app">
                    { this.state.loading ?  <div className="loading"></div> : null }
                    { this.state.showUsers ?  <audienceView.usersList users={this.state.users} renderUser={this.renderUser} deleteUser={this.deleteUser} /> : null }
                    { !this.state.showUsers ?  <audienceView.userProfile user={this.state.user} /> : null }
                </div>
            )
        }
    },
    usersList: class usersList extends React.Component {//render audience table
        componentDidMount(){
            //render table
            $('#users_list_table').dataTable( {
                "sPaginationType": "full_numbers",
                "aaSorting": [[ 3, "desc" ]]
            } );
        }

        render() {
            return (
                <div style={{ maxWidth: '100%' }}>
                    <a href="#" className="btn btn-default btn-users-download" >Download CSV</a>
                    <table cellspacing="0" cellpadding="0" id="users_list_table" className="table user-list table-hover">
                        <thead>
                        <tr>
                            <th>User</th>
                            <th>Tags</th>
                            <th>Email</th>
                            <th>Phone Number</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.props.users.map( user => {
                            return (
                                <audienceView.userListItem user={user} renderUser={this.props.renderUser} deleteUser={this.props.deleteUser} />
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            )
        }
    },
    userListItem: class userListItem extends React.Component {//builds rows for audience table

        fieldExists = (field) =>{
            //if nothing in string return N/A
            let str = 'N/A' ;
            let user = this.props.user ;
            if(user[field] && user[field].length > 0)
                str
            return str ;
        }

        render(){
            const {created_at, meta} = this.props.user
            return(
                <tr>
                    <td>
                        <img src={meta.profile_pic} />
                        <a href="#" className="user-link"  onClick={this.props.renderUser.bind(this,this.props.user)}>
                            {meta.first_name} {(meta.last_name) ? meta.last_name : ''}
                        </a>
                    </td>
                    <td>{audienceView.formatTags(meta.tags)} </td>
                    <td>{this.fieldExists('email')}</td>
                    <td>{this.fieldExists('phonenumber')}</td>
                    <td>{moment( created_at ).format("MM/DD/YYYY h:mm a")}</td>
                    <td>
                        <a className="btn-user-chat table-link" href="#" onClick={this.props.renderUser.bind(this,this.props.user)}>
                            <span className="fa-stack"><i className="fa fa-square fa-stack-2x"></i><i className="fa fa-comment fa-stack-1x fa-inverse"></i></span>
                        </a>
                        <a className="btn-user-delete table-link danger" href="#" onClick={this.props.deleteUser.bind(this, this.props.user)}>
                            <span className="fa-stack"><i className="fa fa-square fa-stack-2x"></i><i className="fa fa-trash-o fa-stack-1x fa-inverse"></i></span>
                        </a>
                    </td>
                </tr>
            )
        }
    },
    userProfile: class usersProfile extends React.Component {//render user profile

        render(){
            // const {created_at, meta, _id} = this.props.user
            return(
                <div>
                    <audienceView.userActivity user={this.props.user} />
                    <div className="row profile-container">
                        <div className="col-lg-3 col-md-4 col-sm-4">
                            <div className="main-box clearfix">
                                <audienceView.userInfo user={this.props.user} />
                            </div>
                        </div>
                        <div className="col-lg-9 col-md-8 col-sm-8">
                            <div className="main-box clearfix">
                                <chatUser.init user={this.props.user} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    },
    userInfo: class userInfo extends React.Component {//render user info

        getCountryTimezone = (type) =>{
            let returnString ;
            if(type == 'country') {
                let _country = admin_dashboard.countries.filter( (country)=> country.code == this.props.user.meta.country_code )
                returnString = _country[0].name
            }else{
                let _timezone = admin_dashboard.timezones.filter( (timezone)=> timezone.offset == this.props.user.meta.timezone )
                returnString = _timezone[0].abbr
            }
            return returnString
        }

        render(){
            const {created_at, meta, tags} = this.props.user
            console.log("meta.country_code " , admin_dashboard.countries) ;
            return(
                <div>
                    <header className="main-box-header clearfix">
                        <h2 className="profile-name">
                            {meta.first_name} {(meta.last_name) ? meta.last_name : ''}
                        </h2>
                    </header>
                    <div className="main-box-body clearfix">
                        <img src={meta.profile_pic} className="profile-img img-responsive center-block" />
                    </div>
                    <div className="profile-since">Member since: {moment( created_at ).format("MMM YYYY")}</div>
                    <div className="profile-details">
                        <ul className="fa-ul">
                            <li className="profile-tags">
                                <i className="fa-li fa fa-tags"></i> Tags: <span>{audienceView.formatTags(tags)}</span>
                            </li>
                            <li className="profile-country">
                                <i className="fa-li fa fa-globe"></i> Country: <span>{this.getCountryTimezone('country')}</span>
                            </li>
                            <li className="profile-timezone">
                                <i className="fa-li fa fa-clock-o"></i> Timezone: <span>{this.getCountryTimezone('timezone')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        }
    },
    userActivity: class userActivity extends React.Component {//render user activity
        componentDidMount(){
            let _url = admin_dashboard.servername + "adminbot/getalluseractivity";
            let data = {} ;
            data.fbid = this.props.user.fbid
            audienceView.fetchPost(_url, data, (userActivity) =>{
                let dataCategory = [] ;
                userActivity.map( (_result) => {
                    let _dateFormat = moment( new Date(_result.period) ).format("YYYY-MM-DD") ;
                    dataCategory.push({
                        period:_dateFormat,
                        count:_result.count
                    }) ;
                } )
                this.loadGraphs(dataCategory)
            })
        }

        loadGraphs(data){
            Morris.Area({
                element: "user-activity-chart",
                data: data,
                xkey: 'period',
                ykeys: ['count'],
                labels: ["Messages"],
                xLabels:'day',
                pointSize: 2,
                gridTextSize:10,
                hideHover: 'auto'
            });
        }

        render(){
            return(
                <div className="col-lg-12">
                    <div className="main-box clearfix">
                        <h2>User Activity</h2>
                        <div id="user-activity-chart"></div>
                    </div>
                </div>
            )
        }
    },
    fetchPost:(url, body, callback) =>{
        fetch(url, {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        }).then(res=>res.json())
            .then(res => {
                // console.log(res)
                callback(res) ;
            });
    },
    formatTags:(tags) =>{
        //build tags string with commas
        let _strTags = "No Tags" ;
        if(tags && tags.length > 0){
            _strTags = "" ;
            tags.map( (_tag, _index) =>{
                //click search tag
                let _tagClick = '<a href="#" class="user-tag" tag="' + encodeURIComponent(_tag.label) + '">' + _tag.label + '</a>' ;
                _strTags += _tagClick ;
                // console.log( _index + " " + (_user.tags.length - 1)) ;
                if(_index < (tags.length - 1))
                    _strTags += ", " ;
            }) ;
        }
        return _strTags
    }
}

ReactDOM.render(
    <audienceView.init />,
    document.getElementById("root")
);
