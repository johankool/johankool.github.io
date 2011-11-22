---
layout: page
title: "Contact"
comments: false
sharing: false
footer: true
---

If you have any kind of question or want to be in contact with Koolistov, please use this form.

<form action="/sendcontact" method="post">
        
<label for="id_name">Your name: </label><br />
<input name="name" id="id_name" type="text" required autofocus placeholder="Enter your name (required)"><br />

<label for="id_email">Your e-mail: </label><br />
<input name="email" id="id_email" type="email" required  placeholder="Enter your e-mail address (required)"><br />

<label for="id_content">Your feedback: </label><br />
<textarea name="content" id="id_content" required placeholder="Please describe your request or issue in detail (at least 20 characters required)" rows="6"></textarea><br />

<input class="submit" type="submit" value="Send" />

<!-- fails in firefox because it supports the required stuff onclick="this.disabled = true; this.value = 'Submitting'; this.form.submit();" -->

</form>