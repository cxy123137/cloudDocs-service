import express from 'express';
import { addFriendBasePermission, addFriendDocPermission, deleteFriendBasePermission, 
    deleteFriendDocPermission, getDocPermissions, getKnowledgePermissions, updateFriendBasePermission, 
    updateFriendDocPermission } from '../service/permission.js'

const permissionRouter = express.Router();

// 增添/授予好友文档权限，permission: 1为管理   2为可写   3为可读
permissionRouter.post('/addFriendDocPermission', async (req, res) => {
    const { userId, docId, permissionCode } = req.query;
    try {
        const result = await addFriendDocPermission(userId, docId, permissionCode);
        res.status(200).json({code: 200, message: '添加好友文档权限成功', data: result.insertedId});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 删除文档内用户权限
permissionRouter.delete('/deleteFriendDocPermission', async (req, res) => {
    const { friendId, docId, permissionCode } = req.query;
    try {
        if (permissionCode === '0') {
            res.status(400).json({code: 400, message: '无法编辑文档持有者权限'});
        }
        const result = await deleteFriendDocPermission(friendId, docId);
        res.status(200).json({code: 200, message: '删除文档内用户权限成功', data: result.matchedCount});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 修改文档内用户权限
permissionRouter.put('/updateFriendDocPermission', async (req, res) => {
    const { friendId, docId, permissionCode } = req.query;
    try {
        if (permissionCode === '0') {
            res.status(400).json({code: 400, message: '无法编辑文档持有者权限'});
        } 
        const result = await updateFriendDocPermission({ friendId, docId, permissionCode });
        res.status(200).json({code: 200, message: '修改文档内用户权限成功', data: result.matchedCount});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 获取文档权限列表
permissionRouter.get('/getDocPermissions/:docId', async (req, res) => {
    const { docId, permissionCode } = req.params;
    try {
        if (permissionCode !== '0' || permissionCode !== '1') {
            res.status(400).json({code: 400, message: '用户管理权限不足'});
        }
        const result = await getDocPermissions(docId);
        res.status(200).json({code: 200, message: '获取文档权限列表成功', data: result});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 知识库相关
// 增添/授予好友知识库权限，permission: 0为管理   1为可写   2为可读
permissionRouter.post('/addFriendBasePermission', async (req, res) => {
    const { userId, baseId, permissionCode } = req.query;
    try {
        const result = await addFriendBasePermission(userId, baseId, permissionCode);
        res.status(200).json({code: 200, message: '添加好友知识库权限成功', data: result.insertedId});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 删除知识库内用户权限
permissionRouter.delete('/deleteFriendBasePermission', async (req, res) => {
    const { friendId, baseId, permissionCode } = req.query;
    try {
        if (permissionCode === '0') {
            res.status(400).json({code: 400, message: '无法编辑文档持有者权限'});
        }
        const result = await deleteFriendBasePermission(friendId, baseId);
        res.status(200).json({code: 200, message: '删除知识库内用户权限成功', data: result.matchedCount});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 修改知识库内用户权限
permissionRouter.put('/updateFriendBasePermission', async (req, res) => {
    const { friendId, baseId, permissionCode } = req.query;
    try {
        if (permissionCode === '0') {
            res.status(400).json({code: 400, message: '无法编辑知识库持有者权限'});
        } 
        const result = await updateFriendBasePermission({ friendId, baseId, permissionCode });
        res.status(200).json({code: 200, message: '修改知识库内用户权限成功', data: result.matchedCount});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

// 获取知识库权限列表
permissionRouter.get('/getKnowledgePermissions/:baseId', async (req, res) => {
    const { baseId, permissionCode } = req.query;
    try {
        if (permissionCode !== '0' || permissionCode !== '1') {
            res.status(400).json({code: 400, message: '用户管理权限不足'});
        }
        const result = await getKnowledgePermissions(baseId);
        res.status(200).json({code: 200, message: '获取知识库权限列表成功', data: result});
    } catch (err) {
        res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
    }
});

export { permissionRouter }