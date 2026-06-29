
window.user = {
    id: null,
    email: null,
    name: null,
    isLoggedIn: false,
    loginMethod: null, // 'email', 'google'
};
var user = window.user;
console.log('Firebase.js loaded, user object initialized:', window.user);
console.log('User object is also available as:', user);
function dataAddWeb(collection, json, docId = null) {
    if (docId) {
        return db.collection(collection).doc(docId).set(json);
    } else {
        return db.collection(collection).doc().set(json);
    }
}
function dataDeleteWeb(collection, docId) {
    db.collection(collection).doc(docId).delete();
}
function dataUpdateWeb(collection, docId, json) {
    db.collection(collection).doc(docId).update(json);
}
function dataGetWeb(collection, docId) {
    return db.collection(collection).doc(docId).get();
}
function dataListWeb(collection) {
    return db.collection(collection).get();
}
function dataQueryWeb(collection, field, operator, value) {
    return db.collection(collection).where(field, operator, value).get();
}
function dataOrderWeb(collection, field, direction = 'asc') {
    return db.collection(collection).orderBy(field, direction).get();
}
function dataLimitWeb(collection, limit) {
    return db.collection(collection).limit(limit).get();
}
function dataPaginateWeb(collection, lastDoc, limit) {
    return db.collection(collection).startAfter(lastDoc).limit(limit).get();
}
function dataListenWeb(collection, callback) {
    return db.collection(collection).onSnapshot(callback);
}
function dataAddWithIdWeb(collection, docId, json) {
    db.collection(collection).doc(docId).set(json);
}
function dataExistsWeb(collection, docId) {
    return db
        .collection(collection)
        .doc(docId)
        .get()
        .then((doc) => doc.exists);
}
function dataBatchAddWeb(collection, dataArray) {
    const batch = db.batch();
    dataArray.forEach((data) => {
        const docRef = db.collection(collection).doc();
        batch.set(docRef, data);
    });
    return batch.commit();
}
function dataBatchDeleteWeb(collection, docIds) {
    const batch = db.batch();
    docIds.forEach((id) => {
        const docRef = db.collection(collection).doc(id);
        batch.delete(docRef);
    });
    return batch.commit();
}
function authRegisterWeb(email, password, additionalData = {}) {
    return firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (additionalData.name) {
                user.updateProfile({
                    displayName: additionalData.name,
                });
            }
            if (Object.keys(additionalData).length > 0) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    createdAt: new Date(),
                    isActive: true,
                    ...additionalData,
                };
                db.collection('users').doc(user.uid).set(userData);
            }

            return user;
        });
}
function authLoginWeb(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
}
function authLogoutWeb() {
    return firebase.auth().signOut();
}
function authResetPasswordWeb(email) {
    return firebase.auth().sendPasswordResetEmail(email);
}
function authCurrentUserWeb() {
    return firebase.auth().currentUser;
}
function authStateListenerWeb(callback) {
    return firebase.auth().onAuthStateChanged(callback);
}
function authGoogleLoginWeb() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date(),
                isActive: true,
                loginMethod: 'google',
            };

            db.collection('users').doc(user.uid).set(userData, { merge: true });

            return user;
        });
}
function authSendEmailVerificationWeb() {
    const user = firebase.auth().currentUser;
    if (user) {
        return user.sendEmailVerification();
    }
    return Promise.reject('No user logged in');
}
function initializeAuthState() {
    console.log('Initializing auth state...');

    authStateListenerWeb((firebaseUser) => {
        console.log('Auth state changed, firebaseUser:', firebaseUser);

        if (firebaseUser) {
            console.log(
                'User is authenticated, updating global user object...',
            );

            window.user.id = firebaseUser.uid;
            window.user.email = firebaseUser.email;
            window.user.name = firebaseUser.displayName || '';
            window.user.isLoggedIn = true;

            console.log('Basic user info set:', {
                id: window.user.id,
                email: window.user.email,
                isLoggedIn: window.user.isLoggedIn,
            });
            dataGetWeb('users', firebaseUser.uid)
                .then((userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        window.user.name =
                            userData.name || firebaseUser.displayName || '';
                        window.user.loginMethod =
                            userData.loginMethod || 'email';
                        console.log(
                            'Additional user data loaded from Firestore:',
                            userData,
                        );
                    } else {
                        window.user.loginMethod = 'email';
                        console.log(
                            'No additional user data found in Firestore',
                        );
                    }
                    localStorage.setItem('user', JSON.stringify(window.user));

                    console.log(
                        '✅ User authenticated and global object updated:',
                        window.user,
                    );
                    console.log(
                        'You can now access user via: window.user or user',
                    );
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                    window.user.loginMethod = 'email';
                    localStorage.setItem('user', JSON.stringify(window.user));
                    console.log(
                        '✅ User authenticated (with Firestore error):',
                        window.user,
                    );
                });
        } else {
            console.log(
                'User is not authenticated, clearing global user object...',
            );

            window.user.id = null;
            window.user.email = null;
            window.user.name = null;
            window.user.isLoggedIn = false;
            window.user.loginMethod = null;
            localStorage.removeItem('user');

            console.log(
                '❌ User not authenticated, global object cleared:',
                window.user,
            );
        }
    });
}

console.log('About to initialize auth state...');
initializeAuthState();
console.log('Auth state initialization called');
