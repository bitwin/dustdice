define([
    'lib/react',
    'lib/keymaster', //TODO: This is window,
    'lib/clib',
    'game-logic/engine',
    'components/top-bar',
    'components/graph',
    'components/controls',
    'components/settings',
    'components/tutorial'
],
function(
    React,
    KeyMaster,
    Clib,
    Engine,
    TopBarClass,
    GraphClass,
    ControlsClass,
    GameSettings,
    GameTutorial
){
    var D = React.DOM;
    var TopBar = React.createFactory(TopBarClass);
    var Graph = React.createFactory(GraphClass);
    var Controls = React.createFactory(ControlsClass);

    var Settings = React.createFactory(GameSettings);
    var Tutorial = React.createFactory(GameTutorial);

    return React.createClass({

        //Global UI States
        getInitialState: function() {
            return {
                showSettings: false,
                showTutorial: false,
                engine: Engine
            }
        },

        componentDidMount: function() {
            KeyMaster.key('c', this._clearHistory);
            KeyMaster.key('s', this._toggleSettings);
            Engine.on('get-user-data', this._getUserData);
            Engine.on('fatal-error', this._fatalError);
        },

        componentWillUnmount: function() {
            KeyMaster.key.unbind('c', this._clearHistory);
            KeyMaster.key.unbind('s', this._toggleSettings);
            Engine.off('get-user-data', this._getUserData);
            Engine.off('fatal-error', this._fatalError);
        },

        _getUserData: function() {
            console.log('Got get-user-data event');
            this.setState({ engine: Engine }); //Just to re render
        },

        _toggleSettings: function() {
            this.setState({ showSettings: !this.state.showSettings, showTutorial: false });
        },

        _toggleTutorial: function() {
            this.setState({ showTutorial: !this.state.showTutorial, showSettings: false });
        },

        _clearHistory: function() {
            Engine.clearHistory();
        },

        _fatalError: function() {
            this.setState({ engine: Engine });
        },

        render: function() {

            console.log('Game component render', Engine.gameState);

            //If the engine does not have the user's data
            if(Engine.error)
                return D.div({ id: 'fatal-error-container'},
                    D.img({ src: '/img/cloud-error.svg' }),
                    D.br(),
                    D.span(null, (typeof Engine.error == 'string')? Engine.error : 'There was a fatal error'),
                    D.br(),
                    D.a({ href: PRODUCTION? 'https://dustdice.com' : 'http://localhost:3001' }, 'Go to DustDice.com')
                );

            if(Engine.gameState === 'OFFLINE')
                return D.div({ id: 'loading-container'},
                    D.img({ src: '/img/loading.gif' })
                );

            var sets = this.state.showSettings ? Settings({
                _toggleSettings: this._toggleSettings,
                _clearHistory: this._clearHistory
            }) : null;

            var tut = this.state.showTutorial ? Tutorial({
                _toggleTutorial: this._toggleTutorial
            }) : null;

            return D.div(null,

                D.div({ id: 'top-bar-container' },
                    TopBar({
                        _toggleTutorial: this._toggleTutorial
                    })
                ),

                D.div({ id: 'graph-container' },
                    Graph()
                ),

                D.div({ id: 'controls-container' },
                    Controls({
                        _toggleSettings: this._toggleSettings,
                        _toggleTutorial: this._toggleTutorial
                    })
                ),

                sets,
                tut
            )
        }
    });
});