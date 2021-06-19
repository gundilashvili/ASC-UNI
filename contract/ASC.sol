 pragma solidity ^0.7.0;  
 

interface IDex {
    function swapExactTokensForTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable  returns (uint[] memory amounts);
    function WETH() external pure returns(address);
}  
 
 
interface IERC20 {
   function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
   function approve(address spender, uint256 amount) external returns (bool);
   function transfer(address recipient, uint256 amount) external returns (bool); 
} 



contract ASC { 
    
    IDex dex;  
    address public owner;   
    uint public fee;
     
    constructor(address _dex, address _owner, uint _fee){
        dex = IDex(_dex); 
        owner = _owner;
        fee = _fee;
    }   
    
    modifier OnlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    } 
    
    
    fallback() external payable {}  
    receive() external payable {}   
 
     
     function swapExactETHForTokens (uint _fee, uint _swapAmount,  uint _amountOutMin, address[] calldata  path ) external payable { 
        require(msg.value > 0);
        require(msg.value  >= _fee + _swapAmount);
        
        address(this).transfer(_fee);
        uint deadline = block.timestamp + 1200;
        dex.swapExactETHForTokens{value: _swapAmount}( _amountOutMin, path, msg.sender, deadline ); 
    }  
     
    
     function swapExactTokensForTokens(uint _totalAmount, uint _swapAmount,  uint _amountOutMin, address _tokenIn,  address _tokenOut ) external {  
        require(_swapAmount > 0);    
        require(_totalAmount > _swapAmount);
        
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _totalAmount);  
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        IERC20(_tokenIn).approve(address(dex), _swapAmount);
        uint deadline = block.timestamp + 1200;
        dex.swapExactTokensForTokens( _swapAmount, _amountOutMin, path, msg.sender, deadline ); 
    }  
     
 
    function resetDEX(address _dexAddress) external OnlyOwner {
        dex = IDex(_dexAddress); 
    }  
    
    
    function resetFee(uint _fee) external OnlyOwner {
        fee = _fee; 
    }   
    
    
    function transferToken(address _tokenAddress, address  _recipient, uint _amount) public  OnlyOwner returns (bool){  
        IERC20(_tokenAddress).transfer(_recipient, _amount);
        return true;
    }  
    
    function transferETH (address payable _recipient, uint _amount) external  OnlyOwner{
        _recipient.transfer(_amount);    
    }   
    
   
    function withdrawETH(address payable  recipient) external OnlyOwner{
        recipient.transfer(address(this).balance);
    }     
   
  
    function transferOwnership (address _owner) external OnlyOwner{
        owner = _owner;
    } 
    
}