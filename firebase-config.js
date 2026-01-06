{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".validate": "newData.hasChildren(['username', 'email', 'score']) && newData.child('username').isString() && newData.child('email').isString() && newData.child('score').isNumber()"
      }
    },
    ".read": false,
    ".write": false
  }
}
