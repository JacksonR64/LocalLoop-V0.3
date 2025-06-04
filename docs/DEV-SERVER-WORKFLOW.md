# 🖥️ Development Server Workflow

## 🎯 **New Workflow: Direct Terminal Control**

**✅ CURRENT CAPABILITY**: Assistant can now directly interact with your terminal using iterm-MCP integration.

### **Assistant Terminal Control Tools:**
- `mcp_iterm-mcp_read_terminal_output` - Read current terminal state  
- `mcp_iterm-mcp_send_control_character` - Send Ctrl+C to stop processes
- `mcp_iterm-mcp_write_to_terminal` - Execute commands directly

### **Standard Dev Server Restart Process:**

1. **Check Current State**:
   ```
   mcp_iterm-mcp_read_terminal_output(linesOfOutput: 5)
   ```

2. **Stop Running Server**:
   ```
   mcp_iterm-mcp_send_control_character(letter: "C")
   ```

3. **Start Fresh Server**:
   ```
   mcp_iterm-mcp_write_to_terminal(command: "npm run dev")
   ```

4. **Verify Startup**:
   ```
   mcp_iterm-mcp_read_terminal_output(linesOfOutput: 15)
   ```

### **When to Restart Dev Server:**

✅ **Automatic Restart Triggers:**
- Code changes to server-side configurations (Stripe settings, API routes)
- Environment variable updates
- Package.json dependency changes
- Build configuration modifications
- Any time user reports issues that could be resolved by restart

✅ **Assistant Responsibility:**
- Monitor terminal output for errors
- Proactively restart when needed for bug fixes
- Ensure clean startup after configuration changes
- Confirm server is running on correct port (3000)

## 📋 **Process Examples**

### **Successful Restart Sequence:**
```bash
# 1. Read current state
> npm run dev running on port 3000

# 2. Stop server
^C (Ctrl+C sent)

# 3. Start fresh
npm run dev

# 4. Confirm startup
✓ Ready in 1333ms
- Local: http://localhost:3000
```

### **Error Handling:**
- If port 3000 occupied: The npm script handles cleanup automatically
- If startup fails: Read error output and address specific issues
- If commands don't work: Verify iterm-MCP connection status

## 🚨 **Deprecated Workflow**

~~**OLD LIMITATION**: Assistant could not interact with existing "@Dev Server" terminal~~

~~**Previous Process**:~~
~~- Assistant would request user to restart manually~~
~~- User had to switch to terminal and run commands~~  
~~- Created delays in debugging workflow~~

**✅ RESOLVED**: Direct terminal control now available via iterm-MCP integration.

## 🔧 **Configuration Requirements**

### **MCP Server Config** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "iterm-mcp": {
      "command": "npx",
      "args": ["-y", "iterm-mcp"]
    }
  }
}
```

### **Terminal Requirements:**
- ✅ iTerm2 application (macOS)
- ✅ Assistant has MCP iterm-mcp server access
- ✅ Terminal session must be active/focused for interaction

## 🎯 **Integration Benefits**

✅ **Faster Debugging**: Immediate server restarts when needed  
✅ **Autonomous Operation**: No user intervention required  
✅ **Real-time Monitoring**: Can read logs and errors directly  
✅ **Proactive Maintenance**: Restart before issues escalate  
✅ **Seamless Development**: Focus on code, not infrastructure  

---

**Status**: ✅ **ACTIVE** - iterm-MCP integration implemented and tested successfully  
**Last Updated**: 2025-06-04 