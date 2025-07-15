import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import openai from '@/lib/openai';

interface StudentData {
  name: string;
  studentNumber: string;
  university: string;
  isValidUniversity: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { ocrText } = await request.json();

    if (!ocrText) {
      return NextResponse.json(
        { error: 'OCR text is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Starting AI analysis with text:', ocrText.substring(0, 100) + '...');

    const prompt = `
You are analyzing OCR text from a Malaysian student ID. Extract the following data **even if the text is messy or split across lines**.

OCR Text:
"""
${ocrText}
"""

Your job is to return only this valid JSON object:
{
  "name": "Student's full name (merge multiple lines, e.g. 'BIN' or 'BINTI' on one line, rest on next line)",
  "studentNumber": "Student number (usually 10 digits, starts with 20)",
  "university": "Full university name (e.g., UNIVERSITI TEKNOLOGI MARA)",
  "isValidUniversity": true/false (true if university is UNIVERSITI TEKNOLOGI MARA or UiTM, false otherwise)
}

🧠 Extraction Notes:
- Combine lines to reconstruct name (e.g., if "BIN" is on one line and the surname is on the next).
- The student number is a 10-digit number starting with 20.
- Only consider "UNIVERSITI TEKNOLOGI MARA" or "UiTM" as valid universities.
- If a field is missing, use an empty string "".

Example expected output:
{"name":"MUHAMMAD SAFWAN BIN SHAMSUDIN","studentNumber":"2022882912","university":"UNIVERSITI TEKNOLOGI MARA","isValidUniversity":true}

Return only valid JSON. No comments or explanation.
`;

    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gpt-4o-mini",
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500,
      });

      const response = chatCompletion.choices[0]?.message?.content || '{}';
      
      console.log('🤖 AI Raw Response:', response);
      
      // Try to parse the JSON response
      try {
        const parsedData = JSON.parse(response);
        console.log('✅ AI Parsed Data:', parsedData);
        
        const result: StudentData = {
          name: parsedData.name || '',
          studentNumber: parsedData.studentNumber || '',
          university: parsedData.university || '',
          isValidUniversity: parsedData.isValidUniversity || false
        };

        return NextResponse.json({
          success: true,
          data: result,
          message: 'OCR text parsed successfully'
        });

      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', response);
        console.error('Parse error:', parseError);
        
        // Fallback to basic regex parsing
        return getFallbackParsing(ocrText);
      }

    } catch (aiError) {
      console.error('❌ Error with AI parsing:', aiError);
      
      // Fallback to basic regex parsing
      return getFallbackParsing(ocrText);
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback parsing function using regex
function getFallbackParsing(text: string): NextResponse {
  console.log('🔄 Falling back to regex parsing...');
  
  const studentNumberMatch = text.match(/20\d{8}/);
  
  // Enhanced name extraction for fallback
  let extractedName = '';
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip university, course, and system text
    if (line.toUpperCase().includes('UNIVERSITI') || 
        line.toUpperCase().includes('TEKNOLOGI') ||
        line.toUpperCase().includes('MARA') ||
        line.toUpperCase().includes('KEMENTERIAN') ||
        line.toUpperCase().includes('PENGAJIAN') ||
        line.toUpperCase().includes('TINGGI') ||
        line.toUpperCase().includes('MYSISWA') ||
        line.toUpperCase().includes('KOLEJ') ||
        line.toUpperCase().includes('VISA') ||
        line.toUpperCase().includes('DEBIT') ||
        line.toUpperCase().includes('MYDEBIT') ||
        line.toUpperCase().includes('ISLAMIC') ||
        line.toUpperCase().includes('RHB') ||
        /^\d+$/.test(line) ||
        /[A-Z]{2,4}[a-z]*\d{3,4}/.test(line)) {
      continue;
    }

    // Look for name lines (letters, spaces, @)
    if (/^[A-Za-z\s@:]+$/.test(line) && line.length > 5 && line.includes(' ')) {
      let potentialName = line.trim().toUpperCase().replace(/[:\s]+$/, '');
      
      // Check if this is part of a multi-line name
      if (i + 1 < lines.length && (potentialName.includes('BIN ') || potentialName.includes('BINTI '))) {
        const nextLine = lines[i + 1].toUpperCase();
        if (/^[A-Z\s@:]+$/.test(nextLine) && 
            nextLine.length > 2 && 
            !nextLine.includes('KOLEJ') && 
            !nextLine.includes('CDCS') &&
            !/\d/.test(nextLine)) {
          const cleanNextLine = nextLine.replace(/[:\s]+$/, '').trim();
          potentialName = potentialName + ' ' + cleanNextLine;
          i++; // Skip next line
        }
      }
      
      if (!extractedName || potentialName.length > extractedName.length) {
        extractedName = potentialName;
      }
    }
  }
  
  const fallbackResult: StudentData = {
    name: extractedName,
    studentNumber: studentNumberMatch ? studentNumberMatch[0] : '',
    university: text.toUpperCase().includes('UNIVERSITI') && text.toUpperCase().includes('TEKNOLOGI') && text.toUpperCase().includes('MARA') ? 'UNIVERSITI TEKNOLOGI MARA' : '',
    isValidUniversity: text.toUpperCase().includes('UNIVERSITI') && text.toUpperCase().includes('TEKNOLOGI') && text.toUpperCase().includes('MARA')
  };
  
  console.log('🔄 Fallback result:', fallbackResult);
  
  return NextResponse.json({
    success: true,
    data: fallbackResult,
    message: 'OCR text parsed using fallback method (AI parsing failed)',
    fallback: true
  });
} 