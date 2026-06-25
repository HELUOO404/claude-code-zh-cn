/**
 * IPC 协议保护单元测试
 * 运行方式: node test/ipc-protection.test.js
 */

// 模拟 Translator 类中的 isInIpcContext 方法
function isInIpcContext(content, ruleOriginal) {
    const escaped = ruleOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ipcPattern = new RegExp(
        '(?:sendRequest|postMessage)\\(\\{[^}]*?(?:type|command)\\s*:\\s*' + escaped
    );
    return ipcPattern.test(content);
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log('  PASS:', testName);
        passed++;
    } else {
        console.error('  FAIL:', testName);
        failed++;
    }
}

console.log('=== IPC 协议保护测试 ===\n');

// Test group 1: 应该被检测为 IPC 上下文
console.log('--- 应检测为 IPC 上下文 ---');

assert(
    isInIpcContext(
        'sendRequest({type:"install_plugin",data:{}})',
        '"install_plugin"'
    ),
    'sendRequest 中的 install_plugin'
);

assert(
    isInIpcContext(
        'sendRequest({type:"uninstall_plugin",id:1})',
        '"uninstall_plugin"'
    ),
    'sendRequest 中的 uninstall_plugin'
);

assert(
    isInIpcContext(
        'sendRequest({type:"set_plugin_enabled"})',
        '"set_plugin_enabled"'
    ),
    'sendRequest 中的 set_plugin_enabled'
);

assert(
    isInIpcContext(
        'sendRequest({type:"add_marketplace"})',
        '"add_marketplace"'
    ),
    'sendRequest 中的 add_marketplace'
);

assert(
    isInIpcContext(
        'sendRequest({type:"remove_marketplace"})',
        '"remove_marketplace"'
    ),
    'sendRequest 中的 remove_marketplace'
);

assert(
    isInIpcContext(
        'sendRequest({type:"refresh_marketplace"})',
        '"refresh_marketplace"'
    ),
    'sendRequest 中的 refresh_marketplace'
);

assert(
    isInIpcContext(
        'postMessage({type:"install_plugin"})',
        '"install_plugin"'
    ),
    'postMessage 中的 install_plugin'
);

assert(
    isInIpcContext(
        'postMessage({command:"install_plugin"})',
        '"install_plugin"'
    ),
    'postMessage 带 command 属性'
);

assert(
    isInIpcContext(
        'postMessage({ command: "install_plugin" })',
        '"install_plugin"'
    ),
    'postMessage 带空格的属性'
);

// Test group 2: 不应被检测为 IPC 上下文 (正常 UI 文本)
console.log('\n--- 不应检测为 IPC 上下文 ---');

assert(
    !isInIpcContext(
        '"Install plugin"',
        '"Install plugin"'
    ),
    '正常 UI 文本 (不在 send 调用中)'
);

assert(
    !isInIpcContext(
        'text = "install_plugin"',
        '"install_plugin"'
    ),
    '变量赋值 (非 IPC 上下文)'
);

assert(
    !isInIpcContext(
        'console.log("install_plugin")',
        '"install_plugin"'
    ),
    'console.log 中的字符串'
);

assert(
    !isInIpcContext(
        '"Manage Plugins"',
        '"Manage Plugins"'
    ),
    'UI 标签文本'
);

assert(
    !isInIpcContext(
        '"Hello world"',
        '"Hello world"'
    ),
    '简单 UI 字符串'
);

// Test group 3: 特殊字符转义
console.log('\n--- 特殊字符转义测试 ---');

assert(
    isInIpcContext(
        'sendRequest({type:"test.value"})',
        '"test.value"'
    ),
    '原文包含点号'
);

assert(
    isInIpcContext(
        'sendRequest({type:"test+value"})',
        '"test+value"'
    ),
    '原文包含加号'
);

assert(
    !isInIpcContext(
        '"normal text"',
        '"normal text"'
    ),
    '普通文本不误报'
);

// Summary
console.log('\n=== 结果: ' + passed + ' 通过, ' + failed + ' 失败 ===');
process.exit(failed > 0 ? 1 : 0);
