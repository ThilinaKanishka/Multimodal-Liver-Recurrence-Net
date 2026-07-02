import smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
msg = MIMEMultipart()
msg['Subject'] = 'HepatoAI Clinical Pipeline - Account Provisioned'
msg['From'] = formataddr(('HepatoAI IT Operations', 'thilinakanishka20010313@gmail.com'))
msg['To'] = 'thilina20010313@gmail.com'
with open('email_test_html.html', 'r', encoding='utf-8') as f:
    html = f.read()
msg.attach(MIMEText(html, 'html'))
s = smtplib.SMTP_SSL('smtp.gmail.com', 465)
s.login('thilinakanishka20010313@gmail.com', 'uolodxmmlxzotoyn')
s.send_message(msg)
s.quit()
print('Direct HTML email sent successfully')
