define([
    'lib/react',
    'game-logic/engine',
    'lib/keymaster', //TODO: This is window
    'lib/clib',
    'stores/game-settings'
    //'jquery-text-width'
], function(
    React,
    Engine,
    KeyMaster,
    Clib,
    GameSettings
    //jQuery,
){
    /* Constants */
    //var _widthTrigger = 992;

    var D = React.DOM;

    function getBetMultiplier() {
        var payout = (98/Engine.winProb);
        return (payout/(payout-1));
    }

    function getState() {
        var state = {};
        state.engine = Engine; //Just a reference no real reason to do this but to remember than this reflects a change of the state

        //Calculate control states that are based on engine states
        //state.canDivideBet = (Engine.wager >= 200);
        //state.canDoubleBet = ( Engine.wager*2 <= Engine.balance && Engine.wager*2 <= Engine.maxBet  );
        state.canBet = (Engine.balance >= Engine.wager && Engine.wager > 0 );
        return state;
    }

    function jackPotProbText() {

        //Fix the bet calculation to the rounded version of the bet
        var ratio = Clib.jackWinProbSatoshisRatio(Clib.roundTo100(Engine.wager), Engine.jackpot);

        if(ratio <= 1) {
            var multi = '';
            var inHowMany = 1/ratio;
            if(inHowMany > 1000000) {
                inHowMany = inHowMany/1000000;
                multi = 'M';
            } else if(inHowMany > 1000) {
                inHowMany = inHowMany/1000;
                multi = 'K';
            }
            return '1 in ' + Math.round(inHowMany) + multi;
        } else {
            return '1 in 1';
        }
    }

    return React.createClass({
        displayName: 'ControlsContainer',

        propTypes: {
            _toggleSettings: React.PropTypes.func.isRequired
        },

        getInitialState: function() {
            return getState();
        },

        componentDidMount: function() {
            //window.addEventListener('resize', this._handleResize);
            Engine.on('all', this._onChange);
            GameSettings.on('all', this._onChange);

            KeyMaster.key('up', this._chaseBet);
            KeyMaster.key('down', this._divideBet);
            KeyMaster.key('right', this._betHi);
            KeyMaster.key('left', this._betLo);
            KeyMaster.key('q', this._decreaseWinProb);
            KeyMaster.key('r', this._increaseWinProb);

        },

        componentWillUnmount: function() {
            //window.removeEventListener('resize', this._handleResize);
            Engine.off('all', this._onChange);
            GameSettings.off('all', this._onChange);

            KeyMaster.key.unbind('up', this._chaseBet);
            KeyMaster.key.unbind('down', this._divideBet);
            KeyMaster.key.unbind('right', this._betHi);
            KeyMaster.key.unbind('left', this._betLo);
            KeyMaster.key.unbind('q', this._decreaseWinProb);
            KeyMaster.key.unbind('r', this._increaseWinProb);
        },

        _onChange: function() {
            if(this.isMounted())
                this.setState(getState());
        },

        //_handleResize: function() {
        //    var smallViewPort = (window.innerWidth < _widthTrigger);
        //    if(this.state.smallViewPort !== smallViewPort)
        //        this.setState({ smallViewPort: smallViewPort });
        //},

        _betHi: function() {
            if(Engine.gameState != 'BETTING' && this.state.canBet)
                Engine.bet(true);
        },

        _betLo: function() {
            if(Engine.gameState != 'BETTING' && this.state.canBet)
                Engine.bet(false)
        },

        _chaseBet: function() {
            Engine.setWager( Engine.wager * getBetMultiplier() );
        },

        _divideBet: function() {
            var newWager = Engine.wager/getBetMultiplier();
            if(newWager < 100)
                newWager = 100;

            Engine.setWager(newWager);
        },

        _increaseWinProb: function() {
            if(Engine.winProb<=96)
                Engine.setWinProb(Engine.winProb + 1);
        },

        _decreaseWinProb: function() {
            if(Engine.winProb>=2)
                Engine.setWinProb(Engine.winProb - 1);
        },

        _goToVaultDeposit: function() {
            window.location.href = 'http://vault.moneypot.com'; //Will take you to Google.
        },

        render: function() {

            var isBetting = Engine.gameState === 'BETTING';

            var betHiBtn, betLoBtn, chaseBetBtn, divideBetBtn;

            if(GameSettings.showButtons) {
                betHiBtn = D.button(
                    {
                        id: 'bet-hi-button',
                        className: 'btn btn-default ctl-button' + ((this.state.canBet)? '' : ' cant-bet'),
                        onClick: (this.state.canBet)? this._betHi : this._goToVaultDeposit,
                        disabled: isBetting
                    },
                    (this.state.canBet)?
                        D.div(null, D.span(null, (101-Engine.winProb) + ' to 100 '), D.i({ className: 'fa fa-caret-square-o-right' })) :
                        ('Deposit in Vault'));

                betLoBtn = D.button(
                    {
                        id: 'bet-lo-button',
                        className: 'btn btn-default ctl-button' + ((this.state.canBet)? '' : ' cant-bet'),
                        onClick: (this.state.canBet)? this._betLo : this._goToVaultDeposit,
                        disabled: isBetting
                    },
                    (this.state.canBet)?
                        D.div(null, D.i({ className: 'fa fa-caret-square-o-left' }), D.span(null, ('1 to ' + Engine.winProb))) :
                        ('Not enogh bits'));

                chaseBetBtn = D.button({ id: 'bet-chase-bet-button', className: 'btn btn-default ctl-button', onClick: this._chaseBet },
                    D.span(null, 'x' + getBetMultiplier().toFixed(2)),
                    D.i({ className: 'fa fa-caret-square-o-up' })
                );

                divideBetBtn = D.button({ id: 'bet-divide-bet-button', className: 'btn btn-default ctl-button', onClick: this._divideBet },
                    D.i({ className: 'fa fa-caret-square-o-down' }),
                    D.span(null, '/' + getBetMultiplier().toFixed(2))
                );
            } else {
                betHiBtn = betLoBtn = chaseBetBtn = divideBetBtn = null;
            }

            return D.div({ id: 'controls-container-box' },

                //Game Buttons
                betHiBtn,
                betLoBtn,
                chaseBetBtn,
                divideBetBtn,

                D.div({ id: 'ctl-bet-box', onClick: this.props._toggleSettings },
                    D.div({ className: 'ctl-state-name' },
                        D.span(null, 'BET')
                    ),
                    D.div({ className: 'crl-in-bottom' },
                        D.div({ className: 'ctl-state-amount' },
                            D.span(null, Clib.formatSatoshis(Engine.wager, 0))
                        ),
                        D.span({ className: 'ctrl-state-lbl' },
                            D.i({ className: 'fa fa-btc' }), Clib.bitsTextTerm(Clib.satToBitRounded(Engine.wager))
                        )
                    )
                ),

                D.div({ id: 'ctl-payout-box', onClick: this.props._toggleSettings },
                    D.div({ className: 'ctl-state-name' },
                        D.span(null, 'PAYOUT')
                    ),
                    D.div({ className: 'crl-in-bottom' },
                        D.div({ className: 'ctl-state-amount' },
                            D.span(null, (98/Engine.winProb).toFixed(2))
                        ),
                        D.span({ className: 'ctrl-state-lbl' },
                            D.i({ className: 'fa fa-times' })
                        )
                    )
                ),

                D.div({ id: 'ctl-win-prob-box', onClick: this.props._toggleSettings },
                    D.div({ className: 'ctl-state-name' },
                        D.span(null, 'WIN PROB')
                    ),
                    D.div({ className: 'crl-in-bottom' },
                        D.div({ className: 'ctl-state-amount' },
                            D.span(null, Engine.winProb)
                        ),
                        D.span({ className: 'ctrl-state-lbl' },
                            D.i({ className: 'icon-percent'})
                        )
                    )
                ),

                D.div({ id: 'ctl-jackpot-box', onClick: this.props._toggleSettings },
                    D.div({ className: 'ctl-state-name' },
                        D.span(null, 'JACKPOT PROB')
                    ),
                    D.div({ className: 'ctl-state-amount' },
                        D.span(null, jackPotProbText())
                    )
                )

            );

        }
    });
});