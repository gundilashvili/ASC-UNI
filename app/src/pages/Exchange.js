import React from 'react' 
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem'; 
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button'; 
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
 
import web3 from '../eth/web3' 
import ASC from '../eth/ASC_Contract'
import UNI_ROUTER from '../eth/UniswapRouter'
import ERC20_ABI from '../eth/ERC20_ABI'

export default class Exchange extends React.Component{

    
    state = {
        tokenFrom : '0xc778417e063141139fce010982780140aa0cd5ab',
        tokenTo:'',
        amountFrom: 0,
        amountTo: 0, 
        tokenToError: false,
        amountFromError: false, 
        alertSeverity: 'info',
        alertText: '', 
        account: null, 
        pendingTransaction: false,
        feeAmount:0,
        feePercentage: 0.05,
        apporved: false,
        tokens : [
            {  name: 'WETH', address: '0xc778417e063141139fce010982780140aa0cd5ab' },
            {  name: 'GTKN', address: '0x1009cc60620b100a78d83a6c93e0168821b2c8d5' },
            {  name: 'BAT',  address: '0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99' },
            {  name: 'DAI',  address: '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea' },
            {  name: 'UNI',  address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }
        ]
    }






    async componentDidMount() { 
        if(web3){
            const accounts = await web3.eth.getAccounts() 
            this.setState({account: accounts[0]})
        } 
    }





    validate = () => {
        let isError = false
        const errors = { 
            tokenToError: false,
            amountFromError: false
        } 
        if (this.state.tokenTo.length < 1) {
            errors.tokenToError = true
            isError=true
        } 
        if (parseFloat(this.state.amountFrom) < 0.01) {
            errors.amountFromError = true
            isError=true
            
        }    
        this.setState({ 
            amountFromError: errors.amountFromError,  
            tokenToError: errors.tokenToError
        }) 
        return isError
  }







   handleSwap  = async () => {
       try{

        const err = this.validate() 
        if (!err && this.state.account) {  
 
            const account = this.state.account
            let fromAmount = this.state.amountFrom 
            let fromToken = this.state.tokenFrom
            let toToken = this.state.tokenTo 

            const fee = (parseFloat(fromAmount) * this.state.feePercentage) 
            const feeInWei = web3.utils.toWei(fee.toString(), 'ether') 

            const amountIn = parseFloat(fromAmount) - fee 
            const amountIn_Wei =  web3.utils.toWei(amountIn.toString(), 'ether')  

            const amountOut = parseFloat(this.state.amountTo) * 0.80 
            const amountOutInWei =  web3.utils.toWei(amountOut.toString(), 'ether')   
             
            const totalAmountInWei =  web3.utils.toWei(fromAmount.toString(), 'ether')  
            let path = [fromToken,toToken ]


            
            if(fee && amountIn && fromToken.length && toToken.length){ 

                let txn 
                // Swap ETH For Tokens 
                if(fromToken == '0xc778417e063141139fce010982780140aa0cd5ab'){
                    this.setState({ pendingTransaction: true})
                    txn = await ASC.contract.methods.swapExactETHForTokens( 
                        feeInWei,
                        amountIn_Wei,
                        amountOutInWei,
                        path 
                    ).send({
                        value: totalAmountInWei,
                        from: account
                    }) 
                // Swap Tokens For Tokens
                }else{ 
                    this.setState({pendingTransaction: true})

                    // Approve token transferFrom 
                    const tokenContract  = new web3.eth.Contract(ERC20_ABI, fromToken) 
                    const feeApprovement = await tokenContract.methods.approve(ASC.address, totalAmountInWei).send({
                        from: this.state.account
                    }) 
  
                    if(feeApprovement){ 
                        if(feeApprovement.transactionHash){
                            this.setState({apporved: true})
                            // this.setState({alertText: `Approved: ${swapApprovement.transactionHash}`, alertSeverity: 'success'}) 
                            txn = await ASC.contract.methods.swapExactTokensForTokens( 
                                totalAmountInWei,
                                amountIn_Wei,
                                amountOutInWei,
                                fromToken, 
                                toToken 
                            ).send({ 
                                from: account
                            }) 
                        } else{
                            this.setState({alertText: 'Approvement failed', alertSeverity: 'error', pendingTransaction: false,approved:false}) 
                        }
                    }else{
                        this.setState({alertText: 'Approvement failed', alertSeverity: 'error',  pendingTransaction: false, approved:false}) 
                    } 
                } 
               

                
                if(txn){ 
                    this.setState({
                        alertText: `Transaction Succeeded ${txn.transactionHash}`, 
                        alertSeverity: 'success',
                        pendingTransaction: false,
                        approved: false,
                        amountFrom: 0,
                        amountTo:0})
                }else{
                    this.setState({
                        alertText: 'Transaction failed', 
                        alertSeverity: 'error',
                        pendingTransaction: false,
                        approved: false,
                        amountFrom: 0,
                        amountTo:0})
                }
            }  
        }  
       }catch(e){
           console.log(e)
       }
   }

   




    getAccount = async () => {
        if(web3){
            const accounts = await web3.eth.getAccounts() 
            this.setState({account: accounts[0]})
        } 
    }






    getAmountTo = async (value) => {
        try{ 
            if(this.state.tokenTo !== '' && parseFloat(value) > 0.01 && web3){ 
                const tokenIn = this.state.tokenFrom
                const tokenOut = this.state.tokenTo
                const amountFrom = value
                const amountFromInWei =  web3.utils.toWei(amountFrom.toString(), 'ether') 
                 // GET Uniswap amounts out
                const UNI_AmountsOutArr = await UNI_ROUTER.methods.getAmountsOut(amountFromInWei,[tokenIn,tokenOut]).call() 
                if(UNI_AmountsOutArr != null && UNI_AmountsOutArr != undefined){
                    if(UNI_AmountsOutArr.length === 2){
                        let _amount_wei = UNI_AmountsOutArr[1]
                        let _amount  = web3.utils.fromWei(_amount_wei, 'ether') 
                        this.setState({amountTo: parseFloat(_amount).toFixed(2)}) 
                    }
                }
            } 

        }catch(e){
            console.log(e)
        }
    }








    render(){

        function Alert(props) {
            return <MuiAlert  elevation={6} variant="filled" {...props} />;
        }

        
        return (
            <div>
                
                <AppBar position="static" color="inherit">
                    <Toolbar>
                    <Button   
                            variant="outlined" 
                            onClick={async() => {
                                if(!this.state.account){ 
                                    await window.ethereum.enable()
                                    this.getAccount()
                                }
                            }}
                        >{this.state.account ? this.state.account.slice(0,6) +'....' +this.state.account.slice(-4) : 'Connect to Web3'}
                        </Button> 
                    </Toolbar>
                </AppBar>


                <div style={{
                    marginTop:"8%",
                    marginLeft:"5%",
                    width: 450,
                    height: 800,
                    }}>
                    <Paper   >
                        <div style={{ marginLeft:20, marginTop: 10,  fontSize: "1.3rem",  fontWeight: 600, lineHeight : "2.7rem" , color:"#2d3b59"  }}>
                            Swap Crypto to Crypto (ERC20 tokens)
                        </div>

                        <FormControl style={{width: 400, marginLeft:20, marginTop: 30}}>
                            <InputLabel id="demo-simple-select-required-label">From Token</InputLabel>
                            <Select
                            
                                labelId="demo-simple-select-required-label"
                                id="demo-simple-select-required"
                                value={this.state.tokenFrom}
                                onChange={e =>  {
                                    this.setState({tokenFrom: e.target.value})
                                    this.getAmountTo(this.state.amountFrom)
                                }} 
                            > 
                            {this.state.tokens.filter(tkn=> tkn.address != this.state.tokenTo).map(tkn => (
                                <MenuItem value={tkn.address}>{tkn.name}</MenuItem> 
                            ))}
                            </Select>
                            
                        </FormControl>


                        <FormControl style={{width: 400, marginLeft:20, marginTop: 30}}>
                            <InputLabel id="demo-simple-select-required-label">To Token <span style={{color:"red"}}> *</span></InputLabel>
                            <Select 
                                labelId="demo-simple-select-required-label"
                                id="demo-simple-select-required"
                                value={this.state.tokenTo}
                                onChange={e => { 
                                    this.setState({tokenTo: e.target.value, tokenToError:false})
                                    this.getAmountTo(this.state.amountFrom)
                                }} 
                                error={this.state.tokenToError==true}
                            > 
                            {this.state.tokens.filter(tkn => tkn.address != this.state.tokenFrom).map(tkn => (
                                <MenuItem value={tkn.address}>{tkn.name}</MenuItem> 
                            ))}
                            </Select> 
                        </FormControl>



                        <Grid container spacing={3}> 
                            <Grid item xs={6}>
                                <FormControl style={{width: 190, marginLeft:20, marginTop: 50 }}>
                                    <TextField   
                                        label={<span>From Amount <span style={{color:"red"}}> *</span></span>}
                                        variant="outlined"
                                        value={this.state.amountFrom}
                                        onChange={e => {
                                            const amount = (parseFloat(e.target.value) * this.state.feePercentage).toFixed(4)
                                             this.setState({
                                                amountFrom: e.target.value, 
                                                amountFromError: false,
                                                feeAmount: amount
                                            })
                                            this.getAmountTo(e.target.value)
                                        }} 
                                        error={this.state.amountFromError===true}
                                    /> 
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl style={{width: 185, marginTop: 50 }}>
                                    <InputLabel id="demo-simple-select-required-label"> </InputLabel>
                                    <TextField   
                                        label=" To Amount"
                                        disabled={true}
                                        variant="outlined"
                                        value={this.state.amountTo}  
                                    /> 
                                </FormControl>
                            </Grid> 
                        </Grid>



                        
                        {this.state.feeAmount > 0 && (
                             <div style={{ marginLeft:20, marginTop: 20,    color:"#2d3b59"  }}>
                                <span style={{   fontSize: "1.1rem", lineHeight : "2.7rem"    }}>  Fee: {this.state.feeAmount}</span> 
                                <span style={{   fontSize: "0.9rem", lineHeight : "2rem"    }}> 
                                &nbsp; {this.state.tokens.filter(tkn =>tkn.address == this.state.tokenFrom)[0].name}
                             </span> 
                                 
                         </div>
                        )}
                       
                        <Button 
                            variant="contained"  
                            style={{width: 400, marginLeft:20, marginTop: this.state.feeAmount > 0 ? 10:70, 
                            marginBottom: 40}}
                            onClick={this.handleSwap}
                            disabled={this.state.pendingTransaction === true || !this.state.account}
                        >
                        {this.state.tokenFrom !== '0xc778417e063141139fce010982780140aa0cd5ab' ?    this.state.apporved === false ?  'Approve' : 'Swap': 'Swap'}
                        </Button>
                    </Paper>



                    <Snackbar 
                        anchorOrigin={{ vertical: 'top', horizontal: 'right'  }}
                        open={this.state.alertText.length > 0} 
                        autoHideDuration={8000}  
                        onClose={() => this.setState({alertText: ''}) } 
                    >
                        <Alert severity={this.state.alertSeverity}  style={{marginTop: 70, }}>
                            {this.state.alertText}
                        </Alert>
                    </Snackbar>
                </div>

            </div>
            
        )
    }


}