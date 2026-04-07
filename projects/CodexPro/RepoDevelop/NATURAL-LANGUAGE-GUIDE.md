# 📝 Enhanced Natural Language Test Writing Guide

## 🎯 What Changed?

Your framework now understands **MUCH MORE natural language variations**! You don't have to be super specific anymore.

## ✨ New Capabilities

### Before (Limited):
```
Test Case: Login
1. Navigate to login page
2. Enter username "user@test.com"
3. Click login button
4. Verify dashboard is displayed
```

### Now (Flexible):
```
Test Case: Login
1. Head over to the login page
2. Type my email into the username box
3. Put "user@test.com" in there
4. Hit the submit button
5. Make sure I can see my dashboard
6. Check that it says "Welcome back"
```

**Both work perfectly!** 🎉

---

## 📋 Supported Action Keywords

### Navigate (Go to a page)
You can write it ANY of these ways:
- Navigate to
- Go to
- Open
- Visit
- Browse to
- Load
- Access
- Reach
- Head to
- Travel to
- Move to
- Redirect to

**Examples:**
- "Navigate to https://example.com"
- "Head over to the login page"
- "Visit the homepage"
- "Browse to checkout"

---

### Click (Press a button/link)
- Click
- Press
- Tap
- Hit
- Select
- Push
- Activate
- Trigger
- Invoke
- Execute
- Choose
- Pick

**Examples:**
- "Click the login button"
- "Hit the submit button"
- "Tap on continue"
- "Press the search icon"
- "Activate the save control"

---

### Fill (Enter text)
- Enter
- Type
- Input
- Fill
- Write
- Insert
- Put
- Provide
- Add
- Supply
- Key in
- Feed
- Populate

**Examples:**
- "Enter username in email field"
- "Type 'test@example.com' into username"
- "Fill in password with 'SecurePass123'"
- "Put my email in the box"
- "Supply the address details"

---

### Select (Choose from dropdown)
- Select
- Choose
- Pick
- Opt for
- Go with
- Decide on
- Elect
- Set to
- Change to
- Switch to

**Examples:**
- "Select 'United States' from country dropdown"
- "Choose California from state list"
- "Pick the first option"
- "Opt for monthly billing"

---

### Verify (Check something)
- Verify
- Check
- Assert
- Should
- Ensure
- Confirm
- Validate
- Expect
- See
- Observe
- Find
- Look for
- Make sure
- Test that
- Check that

**Examples:**
- "Verify success message appears"
- "Check that user is logged in"
- "Make sure dashboard is visible"
- "Ensure the price is correct"
- "Confirm order was placed"
- "Observe the welcome text"

---

### Wait (Pause execution)
- Wait
- Pause
- Delay
- Hold
- Sleep
- Rest
- Wait for
- Wait until
- Await

**Examples:**
- "Wait for 5 seconds"
- "Wait for page to load"
- "Pause for 2 seconds"
- "Wait until results appear"

---

### Additional Actions

**Hover:**
- Hover over the menu
- Mouse over the icon
- Move cursor to button

**Scroll:**
- Scroll down
- Scroll to bottom
- Page down
- Scroll up to top

**Double Click:**
- Double click on item
- Double-click the file

**Right Click:**
- Right click on image
- Open context menu
- Right-click element

**Drag & Drop:**
- Drag item to basket
- Move element to area

**Upload:**
- Upload a file
- Attach document
- Choose file

**Clear:**
- Clear the field
- Empty the input
- Delete text from box

---

## 🎨 Element Description Variations

The parser understands MANY ways to describe elements:

### Button Examples:
- "the login button"
- "button labeled 'Submit'"
- "'Continue' button"
- "submit control"
- "the blue button on the right"

### Input Field Examples:
- "username field"
- "the email input box"
- "password textbox"
- "search bar"
- "input with placeholder 'Enter name'"

### Link Examples:
- "the homepage link"
- "link saying 'Read more'"
- "'Learn more' link"

### Dropdown Examples:
- "country dropdown"
- "state selection menu"
- "the options list"

---

## 💡 Writing Tips

### ✅ DO Write Naturally:

**Good:**
```
1. Head to the shopping page
2. Type "laptop" into search
3. Hit the search button
4. Pick the first result
5. Make sure price is shown
6. Add it to cart
7. Check cart has 1 item
```

**Also Good:**
```
1. Navigate to shopping page
2. Enter "laptop" in search field
3. Click search button
4. Select first product
5. Verify price displays
6. Click add to cart
7. Verify cart contains 1 item
```

**Both work perfectly!**

### ✅ Mix and Match:

You can use different words in the same test:
```
1. Go to homepage
2. Type in search box
3. Hit enter
4. Pick first result
5. Make sure it loaded
```

### ✅ Use Quotes for Specific Values:

```
1. Enter "john@example.com" in email
2. Type "password123" in password field
3. Select "United States" from country
```

### ✅ Be Natural with Verifications:

```
✓ Make sure I see the welcome message
✓ Check that it says "Success"
✓ Verify the total is correct
✓ Ensure the button is clickable
✓ Confirm the order number appears
```

---

## 🚀 Test Case Format Options

### Option 1: Numbered Steps (Most Common)
```
Test Case: User Login
1. Navigate to login page
2. Enter credentials
3. Click submit
4. Verify logged in
```

### Option 2: Bullet Points
```
Test Case: User Login
- Navigate to login page
- Enter credentials
- Click submit
- Verify logged in
```

### Option 3: BDD Style (Given/When/Then)
```
Test Case: User Login
Given I am on the login page
When I enter valid credentials
And I click the login button
Then I should be logged in
And I should see my dashboard
```

### Option 4: Action/Step Keywords
```
Test Case: User Login
Step 1: Navigate to login page
Step 2: Enter credentials
Step 3: Click submit
Action: Verify logged in
```

**All formats work!** Choose what feels natural to you.

---

## 📚 Complete Examples

### Example 1: E-commerce Flow
```
Test Case: Complete Purchase
1. Head over to the shop
2. Type "running shoes" into search
3. Hit the search icon
4. Pick the first product
5. Choose size "10" from dropdown
6. Select color "Blue"
7. Hit add to cart
8. Make sure cart shows 1 item
9. Navigate to checkout
10. Fill in shipping address
11. Provide payment details
12. Press place order
13. Confirm order confirmation appears
```

### Example 2: Form Submission
```
Test Case: Contact Form
1. Open the contact page
2. Write "John Doe" in name field
3. Put email as "john@example.com"
4. Supply phone number
5. Feed "Help needed" as subject
6. Type a message in the text area
7. Hit send button
8. Wait for 2 seconds
9. See success message
10. Check form is cleared
```

### Example 3: Account Settings
```
Test Case: Update Profile
1. Log into account
2. Go to settings
3. Click on profile tab
4. Update first name
5. Change last name
6. Pick country from dropdown
7. Upload profile picture
8. Save the changes
9. Verify success notification
10. Ensure profile is updated
```

---

## 🎯 Key Takeaways

1. **Write naturally** - Don't force yourself to use specific words
2. **Use quotes** for specific values: "email@test.com"
3. **Be descriptive** with elements: "the blue submit button"
4. **Mix variations** - No need to be consistent across steps
5. **Add context** - "Click the login button on the top right"

---

## 🔥 Pro Tips

### Tip 1: Add Context
Instead of: "Click button"
Write: "Click the submit button at the bottom"

### Tip 2: Be Specific with Multiple Elements
Instead of: "Enter text"
Write: "Enter email in the username field"

### Tip 3: Natural Verifications
Instead of: "Assert visible"
Write: "Make sure I can see the confirmation message"

### Tip 4: Use Real Data
Instead of: "Enter username"
Write: "Enter username 'test@example.com'"

### Tip 5: Describe Expected Results
Instead of: "Verify page loads"
Write: "Check that dashboard page displays with my name"

---

## 🆘 Need More Help?

The enhanced parser now understands **100+ action keywords** and can parse almost any natural language you throw at it!

**Still want even better results?**
1. Open `.env` file
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_key_here
   OPENAI_MODEL=gpt-5.4
   ```
3. The framework will use GPT-5.4 to understand your test cases much better than rule-based parsing alone.

**Happy Testing!** 🚀
