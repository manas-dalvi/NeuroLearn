import sys
import os
import json
import re
from datetime import datetime
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Ensure AI_PROVIDER env variable is set to groq
os.environ["AI_PROVIDER"] = "groq"

# Import the FastAPI app
from app.main import app

client = TestClient(app)

# 1000+ Word Technical Article about HTM
SAMPLE_TEXT_1000 = """
Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to capture the structural and algorithmic properties of the neocortex. The neocortex is the seat of most high-level cognitive functions in the mammalian brain. Structurally, it is a thin sheet of neural tissue divided into regions that are organized in a hierarchy. HTM models copy these hierarchical layers of biological neurons. Unlike traditional deep learning models that process inputs in static batches, HTM operates continuously on streaming data. This enables the model to learn in real-time, online, and without separate training or inference phases. This continuous online learning makes HTM exceptionally well-suited for tracking anomalies in dynamic environments, forecasting time-series trends, and predicting sequence shifts.

At the core of HTM is the use of Sparse Distributed Representations (SDRs). In traditional computer systems, information is stored as dense representations, where all bits are meaningful and most are active. In contrast, SDRs mimic biological neurons where only a tiny percentage—typically one to two percent—of cells are active at any given moment. This sparsity provides significant noise tolerance, as random variations in input do not easily change the meaning of the overall pattern. Furthermore, SDRs offer high storage capacity because the number of possible sparse patterns is astronomically large. Using SDRs allows HTM models to represent multiple contexts simultaneously, filter out sensory background noise, and identify subtle correlations in multi-dimensional data streams.

The learning process in HTM is split into two primary components: the Spatial Pooler and the Temporal Pooler. The Spatial Pooler is responsible for mapping feedforward input vectors to sparse representations. It groups active input bits into active columns of neurons, ensuring that the distribution of active columns across the network remains relatively constant. This process is crucial for maintaining the system's target sparsity. The Spatial Pooler continuously adjusts column connections based on Hebbian learning principles, which strengthen connections to frequently co-active inputs. This adaptation allows the network to maintain stable representations even when the physical sensory inputs undergo minor variations or noise disturbances.

The Temporal Pooler, on the other hand, is responsible for sequence learning and prediction. It learns transitions between active columns over time by modeling the activity of individual biological neurons within the columns. In an HTM network, each column contains multiple cells. When a cell receives predictive input through its lateral connections (synapses) from neighboring active cells, it enters a predictive state. If the column subsequently receives feedforward input from the Spatial Pooler, the cell in the predictive state fires first, inhibiting other cells in the column. This predictive state mechanism represents the network's anticipation of future inputs. If the prediction is correct, the system uses very little energy and processes information quickly.

Learning in the Temporal Pooler relies on synaptic plasticity and connection updates. Synapses in HTM are not represented by numeric weights as they are in backpropagation networks. Instead, they are binary connections with a permanence value. Permanence represents the growth and decay of a physical connection between a pre-synaptic cell and a post-synaptic cell. When a cell fires, the permanence values of its active synapses are increased, while the permanence values of inactive synapses are decreased. This synaptic learning rule allows the network to continuously adapt its predictions to changing patterns in streaming data, growing new connections when new patterns emerge and pruning weak connections when patterns fade.

The ultimate application of these predictive states is anomaly detection. If an input column becomes active without any cell in that column being in a predictive state, it means the input was unexpected. This mismatch between prediction and reality generates an anomaly score. By tracking these unexpected inputs in real-time, HTM systems can identify structural anomalies in server logs, predict mechanical failures in industrial machinery, and detect fraudulent transactions in financial data streams. The sensitivity of the anomaly detector is highly robust because it accounts for the temporal context of the sequence, rather than evaluating data points in isolation.

In comparison to standard deep neural networks, HTM offers several distinct architectural advantages. Deep learning networks rely on backpropagation, which requires offline, iterative optimization over millions of parameters, often leading to catastrophic forgetting of past knowledge when new data is introduced. HTM avoids catastrophic forgetting because its synaptic changes are localized and sparse. The Hebbian learning rules allow it to incorporate new patterns without overwriting existing pathways. Moreover, while deep learning requires separate training pipelines, HTM learns continuously from the data stream, combining learning and inference into a single, unified, online process.

The future of HTM lies in its integration with neuromorphic hardware and physical brain-machine interfaces. By physicalizing the sparse connections of biological neurons, neuromorphic chips can execute HTM algorithms with extremely low power requirements, matching the efficiency of the human brain. Researchers are also exploring the use of HTM models to decode neural signals from biological brains, paving the way for advanced prosthetic devices. As physical hardware becomes increasingly parallelized, the biological plausibility of HTM makes it a leading architecture for next-generation edge artificial intelligence, where continuous, low-latency learning is critical.
"""

REQUIRED_CONCEPTS = [
    "neocortex",
    "streaming data",
    "sparse distributed representations",
    "spatial pooler",
    "temporal pooler",
    "predictive state",
    "synaptic",
    "anomaly",
    "noise tolerance",
    "learning"
]

def run_verify():
    # 1. Sign up a new user
    email = f"tester_{int(datetime.now().timestamp())}@neurolearn.com"
    signup_payload = {
        "email": email,
        "password": "password123",
        "full_name": "Personalization Auditor"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    if signup_res.status_code != 201:
        print(f"Signup failed: {signup_res.text}")
        sys.exit(1)
    
    # 2. Log in
    login_payload = {
        "email": email,
        "password": "password123"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        sys.exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profiles = ["adhd", "autism", "dyslexia"]
    results = {}

    for profile in profiles:
        print(f"\nRunning personalization audit for profile: {profile.upper()}...")
        payload = {
            "content_title": f"Technical Audit {profile.upper()}",
            "text": SAMPLE_TEXT_1000,
            "profile_type": profile
        }
        res = client.post("/api/v1/sessions", json=payload, headers=headers)
        if res.status_code != 201:
            print(f"Session creation failed for {profile}: {res.text}")
            continue
        session_data = res.json()
        chunks = session_data["chunks"]
        
        # Check completeness score and print verification for each chunk
        from app.api.v1.sessions import evaluate_concept_completeness, extract_concept_name
        completeness_errors = []
        print(f"\n--- Chunks for Profile: {profile.upper()} ---")
        for idx, chunk in enumerate(chunks):
            simplified_text = chunk["simplified_text"]
            words = len(simplified_text.split())
            topic_name = extract_concept_name(simplified_text)
            
            # Print verification required logs
            print(f"PROFILE={profile.upper()}")
            print(f"TOPIC_NAME={topic_name}")
            print(f"WORD_COUNT={words}")
            
            score = evaluate_concept_completeness(simplified_text)
            if score < 70.0:
                completeness_errors.append(f"Chunk {idx} has low completeness score ({score:.1f})")
        
        # Assertion: must generate multiple chunks for multi-topic documents
        assert len(chunks) > 1, f"Error: Profile {profile.upper()} collapsed the multi-topic document into only {len(chunks)} chunk!"
        
        # Reconstruct the full simplified/adapted document
        reconstructed_doc = "\n\n".join([c["simplified_text"] for c in chunks])
        
        # Word counts
        orig_words = len(SAMPLE_TEXT_1000.split())
        output_words = len(reconstructed_doc.split())
        retention_pct = (output_words / orig_words) * 100
        
        # Concept checks
        # Let's map required concepts to regex patterns to capture plurals and derivations
        concept_patterns = {
            "neocortex": r'neocortex',
            "streaming data": r'streaming|stream\s+data',
            "sparse distributed representations": r'sparse\s+distributed|SDR',
            "spatial pooler": r'spatial\s+pooler',
            "temporal pooler": r'temporal\s+pooler',
            "predictive state": r'predictive\s+state',
            "synaptic": r'synaps|synapt',
            "anomaly": r'anomal',
            "noise tolerance": r'noise\s+toleran',
            "learning": r'learn'
        }

        retained = []
        missing = []
        for concept, pattern in concept_patterns.items():
            if re.search(pattern, reconstructed_doc, re.IGNORECASE):
                retained.append(concept)
            else:
                missing.append(concept)
        concept_retention = (len(retained) / len(concept_patterns)) * 100
        
        # Profile specific validations
        compliance_errors = [] + completeness_errors
        adaptations = []
        
        if profile == "adhd":
            # Check headers exactly once in document
            goals = len(re.findall(r'#\s+🎯\s+Core\s+Goal', reconstructed_doc, re.IGNORECASE))
            summaries = len(re.findall(r'#\s+⚡\s+Quick\s+Summary', reconstructed_doc, re.IGNORECASE))
            checks = len(re.findall(r'#\s+🧠\s+Quick\s+Check', reconstructed_doc, re.IGNORECASE))
            
            if goals != 1:
                compliance_errors.append(f"ADHD Core Goal header appears {goals} times instead of 1.")
            if summaries != 1:
                compliance_errors.append(f"ADHD Quick Summary header appears {summaries} times instead of 1.")
            if checks != 1:
                compliance_errors.append(f"ADHD Quick Check header appears {checks} times instead of 1.")
                
            adaptations.append("Document-level ADHD structure enforced exactly once.")
            adaptations.append(f"Reconstructed chunks: {len(chunks)} chunks.")
            
        elif profile == "autism":
            # Ensure none of the 5 section structures (Introduction, Definitions, Main Concepts, How It Works, Summary) are present as headers
            secs = ["Introduction", "Definitions", "Main Concepts", "How It Works", "Summary"]
            for sec in secs:
                if (re.search(r'(?i)(?:^|\n)#+\s*(?:\d+\.\s*)?' + re.escape(sec) + r'(?:\n|$)', reconstructed_doc) or 
                    re.search(r'(?i)(?:^|\n)(?:\d+\.\s*)' + re.escape(sec) + r'(?:\n|$)', reconstructed_doc)):
                    compliance_errors.append(f"Autism profile contains forbidden document-level section or header: '{sec}'.")
            
            # Check for markdown bold marker balance
            bold_count = reconstructed_doc.count("**")
            if bold_count % 2 != 0:
                compliance_errors.append("Autism output has unbalanced bold markers (**), indicating markdown corruption.")
                
            # Verify high content retention
            if retention_pct < 85.0:
                compliance_errors.append(f"Autism word retention is too low: {retention_pct:.1f}% (target: 90-95%).")
                
            adaptations.append("Autism profile structured simplified textbook layout verified.")
            adaptations.append(f"Reconstructed chunks: {len(chunks)} chunks.")
            
        elif profile == "dyslexia":
            # Check KEY IDEA occurrence count
            ideas = len(re.findall(r'KEY\s+IDEA', reconstructed_doc, re.IGNORECASE))
            adaptations.append(f"Dyslexia mode generated {ideas} distinct KEY IDEA chunks.")
            
            # Sentence length check
            sentences = []
            for line in reconstructed_doc.split("\n"):
                if line.strip() and not line.strip().startswith("KEY IDEA"):
                    s_list = re.split(r'[.!?]+', line)
                    sentences.extend([s.strip() for s in s_list if s.strip()])
            
            lengths = [len(s.split()) for s in sentences]
            max_len = max(lengths) if lengths else 0
            avg_len = sum(lengths)/len(lengths) if lengths else 0
            exceeding = [s for s in sentences if len(s.split()) > 15]
            
            adaptations.append(f"Dyslexia sentence lengths: Max={max_len} words, Avg={avg_len:.1f} words.")
            if len(exceeding) > 0:
                adaptations.append(f"WARNING: {len(exceeding)} sentences exceed 15 words.")
                for idx, s in enumerate(exceeding[:3]):
                    compliance_errors.append(f"Sentence exceeds 15 words ({len(s.split())} words): '{s}'")
                if len(exceeding) > 3:
                    compliance_errors.append(f"... and {len(exceeding) - 3} more exceeding sentences.")
            else:
                adaptations.append("All sentences under the 15-word threshold.")
                
        results[profile] = {
            "orig_words": orig_words,
            "output_words": output_words,
            "retention_pct": retention_pct,
            "retained_concepts": retained,
            "missing_concepts": missing,
            "concept_retention": concept_retention,
            "compliance_errors": compliance_errors,
            "adaptations": adaptations,
            "simplified_doc": reconstructed_doc,
            "chunks_count": len(chunks)
        }
        
    # Generate the Markdown report in the proper App Data brain folder
    report_path = r"C:\Users\Manas\.gemini\antigravity-ide\brain\2552f0b1-04fb-4c56-ab2d-ae2da8683b92\personalization_audit_report.md"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    report_content = f"""# Cognitive-Profile Personalization Audit Report
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Source Document Word Count: {len(SAMPLE_TEXT_1000.split())} words

## Summary Table

| Profile | Original Words | Output Words | Word Retention % | Concept Retention % | Chunks | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
"""
    for p, data in results.items():
        status_str = "🟢 Passed" if len(data["compliance_errors"]) == 0 else "🔴 Compliance Errors"
        report_content += f"| {p.upper()} | {data['orig_words']} | {data['output_words']} | {data['retention_pct']:.1f}% | {data['concept_retention']:.1f}% | {data['chunks_count']} | {status_str} |\n"
        
    report_content += "\n## Detail Analysis per Profile\n"
    
    for p, data in results.items():
        report_content += f"\n### {p.upper()} Profile\n"
        report_content += f"- **Word Count Retention:** {data['orig_words']} -> {data['output_words']} ({data['retention_pct']:.1f}%)\n"
        report_content += f"- **Concept Retention:** {data['concept_retention']:.1f}% ({len(data['retained_concepts'])}/{len(REQUIRED_CONCEPTS)})\n"
        report_content += f"  - *Retained Concepts:* {', '.join(data['retained_concepts'])}\n"
        if data["missing_concepts"]:
            report_content += f"  - *Missing Concepts:* {', '.join(data['missing_concepts'])}\n"
        else:
            report_content += "  - *Missing Concepts:* None\n"
            
        report_content += "- **Profile-Specific Adaptations:**\n"
        for ad in data["adaptations"]:
            report_content += f"  - {ad}\n"
            
        if data["compliance_errors"]:
            report_content += "- **Compliance Deviations:**\n"
            for err in data["compliance_errors"]:
                report_content += f"  - ⚠️ {err}\n"
        else:
            report_content += "- **Compliance Deviations:** None (Strictly Compliant)\n"

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"\nAudit complete! Report written to: {report_path}")
    
    # Also print the report summary to stdout for terminal inspection
    print("\n" + "="*80)
    print("AUDIT RESULTS SUMMARY")
    print("="*80)
    for p, data in results.items():
        print(f"Profile: {p.upper()}")
        print(f"  Word Retention: {data['retention_pct']:.1f}%")
        print(f"  Concept Retention: {data['concept_retention']:.1f}%")
        print(f"  Chunk Count: {data['chunks_count']}")
        print(f"  Compliance Status: {'🟢 COMPLIANT' if not data['compliance_errors'] else '🔴 DEVIATIONS'}")
        if data['compliance_errors']:
            for err in data['compliance_errors']:
                print(f"    - {err}")
    print("="*80)

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    run_verify()
