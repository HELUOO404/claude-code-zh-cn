const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

/**
 * 翻译引擎：负责应用汉化规则
 */
class Translator {
    constructor(config) {
        this.config = config;
        this.builtInRules = null;
    }

    /**
     * 加载内置翻译规则
     */
    loadBuiltInRules() {
        if (this.builtInRules) return this.builtInRules;

        try {
            const extension = vscode.extensions.getExtension('zstings.claude-code-zh-cn');
            let translationsPath;

            if (extension) {
                translationsPath = path.join(
                    extension.extensionPath,
                    'translations',
                    'built-in.json'
                );
            } else {
                // 如果无法通过 API 获取，使用相对路径
                translationsPath = path.join(
                    __dirname,
                    '..',
                    'translations',
                    'built-in.json'
                );
            }

            if (fs.existsSync(translationsPath)) {
                const content = fs.readFileSync(translationsPath, 'utf8');
                this.builtInRules = JSON.parse(content);
                console.log('成功加载内置翻译规则,共', this.builtInRules.translations.length, '条');
            } else {
                console.warn('未找到内置翻译规则文件:', translationsPath);
                this.builtInRules = { translations: [] };
            }
        } catch (error) {
            console.error('加载内置翻译规则出错:', error);
            this.builtInRules = { translations: [] };
        }

        return this.builtInRules;
    }

    /**
     * 应用三阶段汉化
     */
    async translate(content) {
        console.log('开始应用汉化...');
        const originalLength = content.length;

        // 阶段 1: 前置规则（用户自定义）
        const preRules = this.config.get('preTranslationRules') || [];
        if (preRules.length > 0) {
            console.log('应用前置规则,共', preRules.length, '条');
            content = this.applyRules(content, preRules);
        }

        // 阶段 2: 内置规则
        const builtInRules = this.loadBuiltInRules();
        if (builtInRules.translations && builtInRules.translations.length > 0) {
            console.log('应用内置规则,共', builtInRules.translations.length, '条');
            content = this.applyRules(content, builtInRules.translations);
        }

        // 阶段 3: 后置规则（用户自定义）
        const postRules = this.config.get('postTranslationRules') || [];
        if (postRules.length > 0) {
            console.log('应用后置规则,共', postRules.length, '条');
            content = this.applyRules(content, postRules);
        }

        console.log('汉化完成,文件大小变化:', originalLength, '->', content.length);
        return content;
    }

    /**
     * 翻译 package.json 中的设置面板文本
     */
    async translatePackageJson(content) {
        const settingsRules = this.loadSettingsRules();
        if (!settingsRules) return content;

        try {
            const pkg = JSON.parse(content);
            const configs = pkg.contributes?.configuration;
            if (!configs) return content;

            const configList = Array.isArray(configs) ? configs : [configs];

            for (const config of configList) {
                if (!config.properties) continue;

                for (const [key, prop] of Object.entries(config.properties)) {
                    // 翻译 description（只替换值，不删除字段）
                    if (settingsRules.descriptions?.[key]) {
                        if (prop.description) {
                            prop.description = settingsRules.descriptions[key];
                        }
                        if (prop.markdownDescription) {
                            prop.markdownDescription = settingsRules.descriptions[key];
                        }
                    }
                    // 翻译枚举项描述（不使用 enumItemLabels，有 VS Code 渲染 bug）
                    if (settingsRules.enumDescriptions?.[key]) {
                        prop.enumDescriptions = settingsRules.enumDescriptions[key];
                    }
                }
            }

            return JSON.stringify(pkg, null, 2) + '\n';
        } catch (error) {
            console.error('翻译 package.json 出错:', error);
            return content;
        }
    }

    /**
     * 加载设置面板翻译规则
     */
    loadSettingsRules() {
        try {
            const extension = vscode.extensions.getExtension('zstings.claude-code-zh-cn');
            let settingsPath;

            if (extension) {
                settingsPath = path.join(extension.extensionPath, 'translations', 'settings.json');
            } else {
                settingsPath = path.join(__dirname, '..', 'translations', 'settings.json');
            }

            if (fs.existsSync(settingsPath)) {
                const content = fs.readFileSync(settingsPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('加载设置翻译规则出错:', error);
        }
        return null;
    }

    /**
     * 应用翻译规则
     */
    applyRules(content, rules) {
        for (const rule of rules) {
            if (!rule.original || !rule.chinese) continue;

            try {
                if (rule.regex) {
                    // 使用正则表达式
                    const flags = rule.flags || 'g';
                    const regex = new RegExp(rule.original, flags);
                    content = content.replace(regex, rule.chinese);
                } else {
                    // 简单字符串替换
                    // JSON 中的规则已包含双引号，直接使用
                    // 默认使用 replaceAll（替换所有匹配），除非显式设置为 false
                    if (rule.replaceAll === false) {
                        // 只替换第一个匹配
                        content = content.replace(rule.original, rule.chinese);
                    } else {
                        // 替换所有匹配（默认行为）
                        content = content.replaceAll(rule.original, rule.chinese);
                    }
                }
            } catch (error) {
                console.warn('应用规则出错:', rule, error);
            }
        }

        return content;
    }
}

module.exports = Translator;
