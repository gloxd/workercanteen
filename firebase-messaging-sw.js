<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC_TrbQ8QBkosbQk6-MFcNhonON8_rD1jg",
    authDomain: "psunotification-b8b39.firebaseapp.com",
    projectId: "psunotification-b8b39",
    storageBucket: "psunotification-b8b39.firebasestorage.app",
    messagingSenderId: "418203930365",
    appId: "1:418203930365:web:4a7d49a6f675bdc28c7894",
    measurementId: "G-BNM08047HR"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
