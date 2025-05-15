-- FAQ table migration
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create secure RLS policies for FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Everyone can view published FAQs
CREATE POLICY "Published FAQs are viewable by everyone" ON faqs
  FOR SELECT USING (is_published = true);

-- Only admins can manage FAQs
CREATE POLICY "Only admins can create FAQs" ON faqs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Only admins can update FAQs" ON faqs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Only admins can delete FAQs" ON faqs
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();