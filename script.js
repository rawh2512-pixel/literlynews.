const articles = [
 {title: "Jumat Bersih, Siswa SMKN 3 Lubuklinggau Lakukan Penanaman Tanaman Hias",summary:"Melalui kegiatan Jumat Bersih, para siswa bersama guru menata dan menanam berbagai tanaman di depan ruang tamu sekolah sebagai upaya memperbanyak tanaman serta menciptakan lingkungan yang lebih asri dan segar.",category:"Lingkungan",date:"20 November 2026",author:"Raffid Mahendra",image:"assets/image-1.jpg",url:"artikel/jumat-bersih.html",featured:true}
];
const grid=document.querySelector("#newsGrid"), search=document.querySelector("#searchInput"), empty=document.querySelector("#emptyState");
let active="Semua";
function card(a){return `<a class="news-card" href="${a.url}"><img src="${a.image}" alt=""><div class="news-body"><div class="category">${a.category}</div><h3>${a.title}</h3><p>${a.summary}</p><div class="meta">${a.date} · ${a.author}</div></div></a>`}
function render(){
 const q=search.value.trim().toLowerCase();
 const list=articles.filter(a=>(active==="Semua"||a.category===active)&&(`${a.title} ${a.summary} ${a.category}`).toLowerCase().includes(q));
 grid.innerHTML=list.map(card).join("");
 empty.style.display=list.length?"none":"block";
}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".filter.active")?.classList.remove("active");b.classList.add("active");active=b.dataset.category;render()}));
search.addEventListener("input",render);render();
