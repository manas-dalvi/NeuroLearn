# backend/scratch/generate_5page_pdf.py
import sys
import os
from pypdf import PdfReader, PdfWriter

def generate():
    pdf_path = "../test_document.pdf"
    if not os.path.exists(pdf_path):
        pdf_path = "test_document.pdf"
        
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    # Add the single page 5 times to make a 5-page PDF
    page = reader.pages[0]
    for _ in range(5):
        writer.add_page(page)
        
    output_path = "test_5page.pdf"
    with open(output_path, "wb") as f:
        writer.write(f)
    print(f"Generated 5-page PDF at: {os.path.abspath(output_path)}")
    print(f"Page count: {len(PdfReader(output_path).pages)}")

if __name__ == "__main__":
    generate()
