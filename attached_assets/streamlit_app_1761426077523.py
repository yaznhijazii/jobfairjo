import streamlit as st
import requests
import pdfplumber
from sentence_transformers import SentenceTransformer, util
import openai
import os
import io
import qrcode 

# --- 0. CONFIGURATION AND CUSTOM CSS (FINAL, HIDDEN HEADER) ---
# تحديث عنوان التطبيق في إعدادات الصفحة
st.set_page_config(layout="wide", page_title="JoAcademy Talent Finder", page_icon="⚡️")

# Custom CSS for a professional, polished look
st.markdown("""
<style>
/* Streamlit primary color for buttons/elements (Professional Blue) */
:root {
    --primary-color: #007bff; /* A sharp, professional blue */
}
/* Hide the default Streamlit header/footer/menu for cleaner look */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}

/* --- FINAL HIDE CODES for Header/Watermark (Crucial for Deployment) --- */

/* 1. Hide the entire top header bar (this includes the profile image and the GitHub link) */
[data-testid="stHeader"] {
    display: none !important;
}

/* 2. Hide the Streamlit watermark (the red paper plane logo) */
.stApp a:first-child {
    display: none;
}

/* 3. Also hide the toolbar just in case (e.g., the three dots menu) */
[data-testid="stToolbar"] {
    display: none !important;
}

/* --- END OF HIDE CODES --- */


/* Customizing containers for a card-like effect */
.stContainer {
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    padding: 20px;
    margin-bottom: 20px;
}
/* Center and style the title/header */
h1 {
    text-align: center;
    color: var(--primary-color);
    font-size: 2.5em;
    margin-bottom: 0.5em;
}
h3 {
    color: #495057; /* Dark gray for subheaders */
}
/* Professionalizing success/warning messages */
.stSuccess > div {
    border-left: 5px solid #28a745;
}
.stWarning > div {
    border-left: 5px solid #ffc107;
}
</style>
""", unsafe_allow_html=True)


# --- 1. SECRETS AND MODEL LOADING ---

# OpenAI Key Check
if 'OPENAI_API_KEY' in st.secrets:
    openai.api_key = st.secrets['OPENAI_API_KEY']
    IS_OPENAI_AVAILABLE = True
    st.sidebar.success("✅ Deep AI Matching: ON")
else:
    IS_OPENAI_AVAILABLE = False
    st.sidebar.warning("❌ Deep AI Matching: OFF")
    st.sidebar.caption("Provide API Key in Secrets for 70% accuracy boost.")
    
# Model Loading
@st.cache_resource
def load_model():
    """Load the Sentence-Transformers embedding model"""
    return SentenceTransformer('all-mpnet-base-v2') 

MODEL = load_model()
API_URL = "https://careers.joacademy.com/en/api/v1/career_page/jobs/live"

# --- 2. TEXT EXTRACTION FUNCTIONS ---
def extract_text_from_pdf(uploaded_file):
    """Extract text from PDF using pdfplumber"""
    try:
        file_bytes = uploaded_file.read()
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = "".join(page.extract_text() if page.extract_text() else "" for page in pdf.pages)
        return text
    except Exception as e:
        st.error(f"Error extracting text: {e}")
        return None

# --- 3. JOB FETCHING FUNCTIONS ---
@st.cache_data(ttl=3600) 
def fetch_jobs():
    """Fetch live job listings from API"""
    # Using st.status for interactive job fetching
    with st.status("Fetching Live Jobs...", expanded=True) as status:
        st.write("Connecting to the job API...")
        params = {
            "page[number]": 1, "page[limit]": 50,
            "sort[type]": "created_at", "sort[order]": "desc",
            "slug": "2604-jo-academy"
        }
        try:
            response = requests.get(API_URL, params=params)
            response.raise_for_status() 
            data = response.json()
            
            job_list = []
            for job in data.get('data', []):
                job_list.append({
                    "title": job.get('title'),
                    "full_desc": job.get('job_description', ''),
                    "simple_desc": f"{job.get('department_name')} - {job.get('location')}",
                    "link": job.get('public_link')
                })
            st.write(f"Successfully fetched {len(job_list)} job listings.")
            status.update(label="Jobs Fetched Successfully!", state="complete", expanded=False)
            return job_list
        except requests.exceptions.RequestException as e:
            st.error(f"Failed to fetch jobs: {e}")
            status.update(label="Job Fetch Failed!", state="error", expanded=False)
            return []

# --- 4. DEEP MATCHING FUNCTIONS ---
def get_similarity_score_openai(cv_text, job_desc_text):
    """Use OpenAI to calculate a deeper semantic match score"""
    
    if not IS_OPENAI_AVAILABLE or not openai.api_key:
        return 0.0 

    prompt = f"""
    Compare the CV text and the Job Description text. Determine the similarity score from 0.0 to 1.0. 
    Focus on required skills, experience, and qualifications. Respond with a number only, without any explanation or extra words.

    ---
    **CV:**
    {cv_text[:2500]} 
    ---
    **Job Description:**
    {job_desc_text}
    ---
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo", 
            messages=[
                {"role": "system", "content": "You are an advanced recruitment analyst. Your task is to rate the similarity between the CV and job description. Respond with a number only (from 0.0 to 1.0) representing the matching score."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0 
        )
        score_text = response.choices[0].message.content.strip()
        return float(score_text)
    except Exception as e:
        return 0.0 

# --- 5. MAIN MATCHING LOGIC ---
def match_jobs(cv_text, job_list):
    """Execute the two-stage matching process with interactive status"""
    if not job_list:
        return []

    final_results = []
    
    # Use st.status for a highly interactive process update
    with st.status("Running Advanced Matching Engine...", expanded=True) as status:
        
        # 1. Stage One: Quick Filtering (S-T)
        status.write("🚀 Step 1/2: Initial Semantic Filtering of All Jobs...")
        cv_embedding = MODEL.encode(cv_text, convert_to_tensor=True)
        job_descriptions_simple = [job['title'] + " " + job['simple_desc'] for job in job_list]
        job_embeddings = MODEL.encode(job_descriptions_simple, convert_to_tensor=True)
        cos_scores = util.pytorch_cos_sim(cv_embedding, job_embeddings)[0]
        
        top_indices_st = sorted(
            [(i, score.item()) for i, score in enumerate(cos_scores)],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        status.write(f"✅ Filtered down to {len(top_indices_st)} best candidates.")

        # 2. Stage Two: Deep Scrutiny (OpenAI)
        if IS_OPENAI_AVAILABLE:
            status.write("🧠 Step 2/2: Starting Deep AI Scrutiny for final scores...")
            
            for i, (idx, st_score) in enumerate(top_indices_st):
                job = job_list[idx]
                openai_score = get_similarity_score_openai(cv_text, job['full_desc'])
                
                final_score = (openai_score * 0.7) + (st_score * 0.3)
                final_results.append({"job": job, "score": final_score})
                
            status.update(label="Matching Complete! Results Ready.", state="complete", expanded=False)
        else:
            # Fallback to S-T scores only
            for idx, score in top_indices_st:
                final_results.append({"job": job_list[idx], "score": score})
            status.update(label="Basic Matching Complete! Results Ready.", state="complete", expanded=False)

    final_results.sort(key=lambda x: x['score'], reverse=True)
    return final_results[:3]

# --- 6. MAIN APP INTERFACE (Ultimate UI/UX) ---
def main_app():
    # تهيئة حالة الجلسة (Session State) لعرض تفاصيل البطاقة
    if 'show_details' not in st.session_state:
        st.session_state['show_details'] = False

    # تحديث عنوان التطبيق في الواجهة
    st.markdown("<h1 style='text-align: center;'>JoAcademy Talent Finder</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #495057;'>**Your personalized career path starts here. Precision matching powered by advanced AI.**</p>", unsafe_allow_html=True)
    st.markdown("---")

    # --- STEP 1: CV UPLOAD (Interactive Card) ---
    with st.container(border=True):
        st.markdown("### 1. 📂 Submit Your Resume")
        st.caption("The engine is ready for your file (PDF only).")
        
        uploaded_file = st.file_uploader(
            "Choose a PDF file", 
            type=["pdf"], 
            accept_multiple_files=False,
            label_visibility="collapsed"
        )
    
    cv_text = None
    if uploaded_file:
        st.toast(f"File uploaded: {uploaded_file.name}", icon="📄")
        
        # INTERACTIVITY: Status bar for extraction
        with st.status("Processing CV...", expanded=False) as status:
            st.write("Extracting and cleaning text data...")
            cv_text = extract_text_from_pdf(uploaded_file)
            
            if cv_text:
                status.update(label="Text Extraction Complete!", state="complete", expanded=False)
                st.toast("Text extraction complete! Ready for matching.", icon="📝")
            else:
                status.update(label="Extraction Failed!", state="error", expanded=False)
                st.error("Failed to extract readable text.")


        if cv_text:
            st.markdown("---")
            
            # --- STEP 2: MATCHING EXECUTION ---
            job_list = fetch_jobs() 
            
            if job_list:
                with st.container(border=True):
                    st.markdown("### 2. ⚡️ Initiating Match Analysis")
                    
                    top_matches = match_jobs(cv_text, job_list)
                
                    # --- STEP 3: DISPLAY RESULTS (CARD VIEW) ---
                    st.markdown("---")
                    
                    if top_matches:
                        st.markdown("<h2 style='color: #28a745;'>3. 🏆 Personalized Top Matches</h2>", unsafe_allow_html=True)
                        st.balloons() 
                        
                        # إنشاء 3 أعمدة (بطاقات) لعرض أفضل 3 نتائج
                        cols = st.columns(len(top_matches))
                        
                        for rank, match in enumerate(top_matches):
                            job = match['job']
                            score = match['score']
                            col = cols[rank] # اختيار العمود الحالي (col1, col2, col3)
                            
                            with col:
                                # استخدام الحاوية (container) لتمثيل البطاقة بحدود أنيقة
                                with st.container(border=True): 
                                    st.markdown(f"<h3 style='color:#007bff;'>{rank + 1}. {job['title']}</h3>", unsafe_allow_html=True)
                                    
                                    # عرض درجة المطابقة بشكل جذاب
                                    delta_text = "Deep AI Scrutiny" if IS_OPENAI_AVAILABLE else "Basic Semantic Check"
                                    st.metric(label="Match Confidence", value=f"{score:.2f} %", delta=delta_text)
                                    
                                    st.markdown("---")
                                    
                                    # عرض التفاصيل الأساسية
                                    st.markdown(f"**Department:** {job['simple_desc'].split(' - ')[0]}")
                                    st.markdown(f"**Location:** {job['simple_desc'].split(' - ')[1]}")
                                    
                                    # زر "عرض التفاصيل"
                                    if st.button("🔗 View Details", key=f"details_{rank}"):
                                        # تحديث حالة الجلسة لعرض التفاصيل الكاملة
                                        st.session_state['show_details'] = True
                                        st.session_state['selected_job_rank'] = rank
                                        # إعادة تشغيل التطبيق لعرض التفاصيل الجديدة
                                        st.rerun()
                                    
                                    # زر التقديم (Primary Action)
                                    st.markdown(f"[**APPLY NOW**]({job['link']})", unsafe_allow_html=True)
                                    
                        # --- DETAILED VIEW SECTION ---
                        if st.session_state['show_details']:
                            st.divider()
                            st.markdown("### 👁️ Job Details Overview")
                            
                            # نستخدم التبويبات لعرض تفاصيل الوظيفة التي تم الضغط على زرها
                            selected_rank = st.session_state['selected_job_rank']
                            selected_job = top_matches[selected_rank]['job']
                            
                            with st.expander(f"Full Details for: {selected_job['title']}", expanded=True):
                                st.subheader(selected_job['title'])
                                st.caption(f"Location: {selected_job['simple_desc']}")
                                st.markdown("---")
                                st.markdown(selected_job['full_desc'])
                                st.markdown(f"**Action:** [**APPLY NOW**]({selected_job['link']})")
                                
                                # زر لإخفاء التفاصيل
                                if st.button("✖️ Close Details"):
                                    st.session_state['show_details'] = False
                                    st.rerun()

                    else:
                        st.warning("No high-match jobs found. Try updating your CV.")
            else:
                st.error("Cannot fetch jobs right now. Please check the API status.")

# --- 7. QR CODE GENERATOR INTERFACE ---
def qr_code_generator():
    """Simple QR Code generator for job fair use"""
    st.title("📱 Job Fair QR Code Generator")
    st.subheader("Generate an instant application QR code for visitors.")
    st.markdown("---")
    
    # يجب تحديث هذا الرابط برابط تطبيقك الفعلي بعد النشر
    default_url = "https://your-deployed-app-url.streamlit.app/" 
    app_url = st.text_input(
        "🔗 URL to direct the user to (your App link):", 
        value=default_url
    )
    
    if app_url and app_url != default_url:
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(app_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        st.success("✅ QR Code generated successfully.")
        st.image(img._img, caption='Instant Application QR Code', use_column_width=True)
        
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        st.download_button(
            label="🖼️ Download QR Code (PNG)",
            data=buf.getvalue(),
            file_name="job_fair_qr_code.png",
            mime="image/png"
        )
        
# --- 8. MULTI-PAGE SETUP ---
page_names_to_funcs = {
    "🎯 CV & Job Matching": main_app,
    "📱 QR Code Generator (Fair Use)": qr_code_generator,
}

st.sidebar.title("App Services")
selected_page = st.sidebar.selectbox("Select Service:", page_names_to_funcs.keys())
page_names_to_funcs[selected_page]()