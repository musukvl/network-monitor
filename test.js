let x = [{mac: 1}, {mac: 2}, {mac: 4}];

let y = [{mac: 2}, {mac: 4}];

let exclued = y.filter(yNode => {
   return x.find(xNode => yNode.mac == xNode.mac );
});

console.log(exclued);
