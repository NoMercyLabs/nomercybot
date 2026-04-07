// Mock for expo/src/winter/* — prevents Jest 30 sandbox errors from lazy
// global getters that call require() outside their original module scope.
module.exports = {}
