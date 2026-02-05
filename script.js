import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, 
    doc, updateDoc, deleteDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. KONFIGURASI (Ganti dengan punyamu!)
const firebaseConfig = {
  apiKey: "AIzaSyDFMfnFdriJkui-6WQbZkOnxEnb5rhhnx4",
  authDomain: "jobtrackerpro-56d86.firebaseapp.com",
  projectId: "jobtrackerpro-56d86",
  storageBucket: "jobtrackerpro-56d86.firebasestorage.app",
  messagingSenderId: "240528719923",
  appId: "1:240528719923:web:4b979d8b0ddc97a993a346",
};

// 2. INISIALISASI
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const jobsCol = collection(db, "job_applications");

// State Global
let allJobs = [];
let currentEditId = null;

// DOM Elements
const jobForm = document.getElementById('jobForm');
const jobTableBody = document.getElementById('jobTableBody');
const submitBtn = document.getElementById('submitBtn');

// 3. LISTEN DATA (Real-time Sync)
// Fungsi ini akan otomatis jalan setiap ada perubahan di Cloud (HP atau Laptop)
onSnapshot(query(jobsCol, orderBy("date", "desc")), (snapshot) => {
    allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderData(allJobs);
    calculateStats();
});

// 4. RENDER DATA KE TABEL
function renderData(data) {
    jobTableBody.innerHTML = '';
    data.forEach(job => {
        const row = `
            <tr>
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${job.company}</div>
                    <div class="text-[10px] text-gray-400"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>
                </td>
                <td class="px-6 py-4 text-gray-600">${job.position}</td>
                <td class="px-6 py-4">
                    <span class="status-badge bg-${getStatusClass(job.status)}">${job.status}</span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="editJob('${job.id}')" class="text-blue-400 hover:text-blue-600 transition"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteJob('${job.id}')" class="text-red-300 hover:text-red-500 transition"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        jobTableBody.innerHTML += row;
    });
}

// 5. SIMPAN / UPDATE DATA
jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    const payload = {
        company: document.getElementById('company').value,
        position: document.getElementById('position').value,
        location: document.getElementById('location').value,
        date: document.getElementById('date').value,
        platform: document.getElementById('platform').value,
        status: document.getElementById('status').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (currentEditId) {
            await updateDoc(doc(db, "job_applications", currentEditId), payload);
            currentEditId = null;
            submitBtn.innerText = "Simpan";
        } else {
            await addDoc(jobsCol, payload);
        }
        jobForm.reset();
        document.getElementById('date').valueAsDate = new Date();
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        submitBtn.disabled = false;
    }
});

// 6. EDIT & DELETE (Expose ke global window)
window.deleteJob = async (id) => {
    if (confirm("Hapus data ini dari cloud?")) {
        await deleteDoc(doc(db, "job_applications", id));
    }
};

window.editJob = (id) => {
    const job = allJobs.find(j => j.id === id);
    if (job) {
        document.getElementById('company').value = job.company;
        document.getElementById('position').value = job.position;
        document.getElementById('location').value = job.location;
        document.getElementById('date').value = job.date;
        document.getElementById('platform').value = job.platform;
        document.getElementById('status').value = job.status;
        
        currentEditId = id;
        submitBtn.innerText = "Update Data";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// 7. FILTER & SEARCH
document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allJobs.filter(j => j.company.toLowerCase().includes(term));
    renderData(filtered);
});

document.getElementById('filterStatus').addEventListener('change', (e) => {
    const val = e.target.value;
    const filtered = val === "All" ? allJobs : allJobs.filter(j => j.status === val);
    renderData(filtered);
});

// 8. HELPERS
function getStatusClass(status) {
    if (status.includes('Interview')) return 'interview';
    return status.toLowerCase();
}

function calculateStats() {
    document.getElementById('statTotal').innerText = allJobs.length;
    document.getElementById('statInterview').innerText = allJobs.filter(j => j.status.includes('Interview')).length;
    document.getElementById('statOffering').innerText = allJobs.filter(j => j.status === 'Offering').length;
    document.getElementById('statAccepted').innerText = allJobs.filter(j => j.status === 'Diterima').length;
    document.getElementById('statRejected').innerText = allJobs.filter(j => j.status === 'Ditolak').length;
}

// Set default date
document.getElementById('date').valueAsDate = new Date();