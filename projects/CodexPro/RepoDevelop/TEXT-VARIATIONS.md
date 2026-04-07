# 📝 Supported Text Variations Guide

## 🎯 Good News: You Can Write Test Cases Much More Flexibly Now!

The enhanced parser now supports **100+ different ways** to write your manual test cases. Write naturally - the framework understands!

---

## 🗺️ Navigation Actions

### ✅ All These Work:
```
Navigate to https://example.com
Go to https://example.com
Open https://example.com
Visit https://example.com
Load https://example.com
Browse to https://example.com
Access https://example.com
Launch https://example.com
Start at https://example.com
Redirect to the login page
Land on the homepage
```

### Examples:
```
1. Navigate to https://shop.com
2. Open the product page
3. Visit /dashboard
4. Go to login
5. Access the admin panel
```

---

## 🖱️ Click Actions

### ✅ All These Work:
```
Click the login button
Press the submit button
Tap on the menu icon
Hit the save button
Push the confirm button
Activate the dropdown
Trigger the search
Choose the option
Pick the first item
Click on "Get Started"
```

### Advanced Click Variations:
```
Double click the file
Double-click on the folder
Click twice on the cell
Right click the image
Right-click for context menu
Secondary click on the element
```

### Examples:
```
1. Click the "Sign In" button
2. Press submit
3. Tap on the hamburger menu
4. Hit "Proceed to Checkout"
5. Double click the folder icon
6. Right click on the image
```

---

## ⌨️ Input/Fill Actions

### ✅ All These Work:
```
Enter "john@example.com" in username field
Type "password123" in the password box
Input your email address
Fill in the form field
Write "Test User" in name field
Put "New York" in city
Set email to "test@test.com"
Insert "123456" in zip code field
Add phone number "555-1234"
Provide credit card details
Key in the activation code
Fill in "Admin" as username
Populate the address field
Complete the registration form
```

### Examples:
```
1. Enter "john@test.com" in email field
2. Type "SecurePass123" in password
3. Fill username with "testuser"
4. Put "New York" in the city field
5. Input phone number "555-0123"
6. Write "Test Message" in comment box
```

---

## 📋 Select/Dropdown Actions

### ✅ All These Work:
```
Select "California" from state dropdown
Choose "Premium" from plan menu
Pick "Credit Card" from payment options
Opt for "Express Shipping"
Go with "Monthly" subscription
Decide on "English" language
Take the "Advanced" option
Use "USD" as currency
```

### Examples:
```
1. Select "United States" from country
2. Choose "Weekly" from frequency
3. Pick "Blue" from color options
4. Select "Mr." from title dropdown
```

---

## ✔️ Verify/Assert Actions

### ✅ All These Work:
```
Verify the welcome message is displayed
Check that dashboard page is loaded
Assert success notification appears
Should see "Order Confirmed"
Ensure the cart icon shows "3"
Confirm the user is logged in
Validate email was sent
Test if the form submitted
See the thank you page
Expect error message "Invalid input"
Make sure profile picture is visible
Look for "Welcome" text
Find the logout button
```

### Examples:
```
1. Verify success message is displayed
2. Check the page title is "Dashboard"
3. Assert cart total is "$99.99"
4. Should see "Item added" notification
5. Ensure the username appears in header
6. Make sure the form is submitted
7. Confirm order number is shown
```

---

## ⏳ Wait Actions

### ✅ All These Work:
```
Wait for results to load
Pause for 2 seconds
Hold for the animation to complete
Delay 500 milliseconds
Sleep 1 second
Wait for loading spinner to disappear
Hold on for page to load
Give it 3 seconds
```

### Examples:
```
1. Wait for results to appear
2. Pause for 2 seconds
3. Wait for loading to finish
4. Hold for 1000 milliseconds
5. Wait for page to fully load
```

---

## 🎯 Hover Actions

### ✅ All These Work:
```
Hover over the profile icon
Mouse over the tooltip
Move to the menu item
Point to the help icon
```

### Examples:
```
1. Hover over the username
2. Mouse over the info icon
3. Move to the dropdown menu
```

---

## 📜 Scroll Actions

### ✅ All These Work:
```
Scroll down to footer
Scroll to bottom of page
Scroll up to top
Move down to the form
Page down to contact section
Scroll to "Pricing" section
```

### Examples:
```
1. Scroll down to the pricing section
2. Scroll to bottom of page
3. Move down to footer
4. Scroll up to navigation
```

---

## 🗑️ Clear Actions

### ✅ All These Work:
```
Clear the search field
Delete the input
Remove text from username
Erase the comment
Empty the form
```

### Examples:
```
1. Clear the search box
2. Delete text from email field
3. Remove the entered password
```

---

## 📤 Upload Actions

### ✅ All These Work:
```
Upload "document.pdf"
Attach "resume.docx"
Upload file "image.jpg"
Choose file "data.csv"
Select file to upload
```

### Examples:
```
1. Upload "profile-picture.jpg"
2. Attach "CV_2024.pdf"
3. Choose file "report.xlsx"
```

---

## 🎨 Flexible Element Descriptions

### ✅ All These Formats Work:

```
Click the "Login" button
Click the button labeled "Login"
Click button called "Login"
Click button with text "Login"
Click button saying "Login"
Click on the login button
Click the login button
Press login
```

### More Examples:

```
Enter "email" in the username field
Enter "email" in username
Type "email" into the username box
Fill the username with "email"
Put "email" in username field
Input "email" to username
```

---

## 📋 Complete Test Case Examples

### Example 1: E-commerce Checkout (Natural Language)
```
Test Case: Complete Purchase Flow

1. Open https://shop.com
2. Tap on the "Electronics" category
3. Pick the first product
4. Hit the "Add to Cart" button
5. Make sure cart badge shows "1"
6. Press the cart icon
7. Click on "Checkout"
8. Fill email with "buyer@test.com"
9. Put "123 Main St" in address field
10. Choose "California" from state dropdown
11. Type "90210" in zip code
12. Hit continue
13. Provide card number "4242424242424242"
14. Put "12/25" as expiry
15. Input "123" for CVV
16. Press "Place Order"
17. Wait for confirmation page
18. Verify order number is displayed
19. Check that message says "Thank you"
```

### Example 2: User Registration (Very Casual)
```
Test Case: Sign Up Flow

1. Go to the signup page
2. Write "John Doe" in the name field
3. Put "john@test.com" as email
4. Set password to "SecurePass123"
5. Type the same password again
6. Pick "Developer" from job title
7. Hit the "Create Account" button
8. Wait 2 seconds
9. Make sure welcome message appears
10. See if "Account created" is shown
```

### Example 3: Form Validation (Mixed Style)
```
Test Case: Login Error Handling

1. Visit /login
2. Leave username empty
3. Press the login button
4. Verify error "Username required" appears
5. Enter "test@test.com" in username
6. Keep password blank
7. Click login again
8. Check error message shows "Password required"
9. Fill password with "wrong"
10. Hit login
11. Assert "Invalid credentials" is displayed
```

---

## 🎯 Tips for Writing Test Cases

### ✅ DO:
- Use natural, conversational language
- Be specific about what you're clicking ("Login button" not just "button")
- Include data in quotes for clarity
- Mix and match action words - they all work!
- Write as if you're explaining to a colleague

### ❌ DON'T:
- No need to be too formal
- Don't worry about exact keywords
- Don't stress about format
- Don't use overly technical language unless needed

---

## 🚀 Before vs After

### ❌ OLD (Limited - Had to be precise):
```
Test Case: Login
1. Navigate to https://example.com/login
2. Enter username "user@test.com"
3. Enter password "pass123"
4. Click login button
5. Verify user is logged in
```

### ✅ NEW (Flexible - Write however you want!):
```
Test Case: Login

1. Open https://example.com/login
2. Put "user@test.com" in the username box
3. Fill password with "pass123"
4. Hit the login button
5. Make sure dashboard is displayed
```

OR

```
Test Case: Login

1. Go to the login page
2. Type "user@test.com" as username
3. Input "pass123" for password
4. Press login
5. Check that user is logged in
```

OR

```
Test Case: Login

1. Visit /login
2. Write "user@test.com" in username field
3. Set password to "pass123"
4. Tap the submit button
5. Verify welcome message appears
```

**ALL THREE WORK THE SAME!** 🎉

---

## 📊 Keyword Reference Chart

| Category | Keywords Available | Total |
|----------|-------------------|-------|
| **Navigate** | navigate, go to, open, visit, load, browse to, access, launch, start at, redirect to, land on | 11 |
| **Click** | click, press, tap, hit, push, activate, trigger, choose, pick, click on | 10 |
| **Fill** | enter, type, input, fill, write, put, set, insert, add, provide, key in, fill in, populate, complete | 14 |
| **Select** | select, choose, pick, opt for, go with, decide on, take, use | 8 |
| **Verify** | verify, check, assert, should, ensure, confirm, validate, test, see, expect, make sure, look for, find | 13 |
| **Wait** | wait, pause, hold, delay, sleep, wait for, hold on, give it | 8 |
| **Hover** | hover, mouse over, move to, point to | 4 |
| **Scroll** | scroll, scroll to, scroll down, scroll up, move down, move up, page down, page up | 8 |
| **Clear** | clear, delete, remove, erase, empty | 5 |
| **Double Click** | double click, double-click, dblclick, click twice | 4 |
| **Right Click** | right click, right-click, context menu, secondary click | 4 |
| **Upload** | upload, attach, upload file, choose file, select file | 5 |

**Total: 94+ keyword variations supported!**

---

## 🎉 Summary

You now have **MUCH MORE FREEDOM** in how you write test cases!

- ✅ **90+ action keywords** supported
- ✅ **Natural language** understanding
- ✅ **Flexible element descriptions**
- ✅ **Multiple ways to say the same thing**
- ✅ **Write conversationally**

**Just write naturally, and the framework will understand!** 🚀
