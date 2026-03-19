"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Home() {
const [page, setPage] = useState("login");
const [user, setUser] = useState(null);
const [student, setStudent] = useState(null);

const API = "http://localhost:3000";

// ---------------- LOGIN ----------------
const login = async (role) => {
const res = await fetch(API + "/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ username: role, password: "1234" }),
});

```
if (res.ok) {
  setUser(role);
  setPage(role);
}
```

};

// ---------------- QR SCAN ----------------
useEffect(() => {
if (page === "teacher") {
const scanner = new Html5QrcodeScanner("reader", { fps: 10 });

```
  scanner.render((text) => {
    fetch(API + "/student/" + text)
      .then((res) => res.json())
      .then(setStudent);
  });
}
```

}, [page]);

// ---------------- USE HOURS ----------------
const useHours = async (h) => {
await fetch(API + "/attendance", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
student_id: student.student_id,
course_id: student.course_id,
hours_used: h,
}),
});

```
setStudent({
  ...student,
  remaining_hours: student.remaining_hours - h,
});
```

};

// ---------------- UI ----------------
if (page === "login") {
return (
<div style={{ padding: 20 }}> <h2>Login</h2>
<button onClick={() => login("admin")}>Admin</button>
<button onClick={() => login("teacher")}>Teacher</button> </div>
);
}

if (page === "admin") {
return (
<div style={{ padding: 20 }}> <h2>Admin</h2>

```
    <button onClick={() => window.open(API + "/export")}>
      Export Excel
    </button>

    <button onClick={() => setPage("login")}>Logout</button>
  </div>
);
```

}

if (page === "teacher") {
return (
<div style={{ padding: 20 }}> <h2>Scan QR</h2>

```
    <div id="reader"></div>

    {student && (
      <div>
        <h3>{student.name}</h3>
        <p>เหลือ {student.remaining_hours} ชม</p>

        <button onClick={() => useHours(1)}>+1</button>
        <button onClick={() => useHours(2)}>+2</button>
      </div>
    )}
  </div>
);
```

}
}
