"use server";

import { auth } from "@/lib/auth";
import { db, orders } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * 调试 API：查看当前用户的订单和 userId 信息
 * 仅用于调试，生产环境建议删除
 */
export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; username?: string; provider?: string } | undefined;
    
    if (!session || !user?.id) {
      return NextResponse.json({
        status: "not_logged_in",
        session: null,
        orders: [],
      });
    }

    // 查询用户的订单
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: [desc(orders.createdAt)],
      limit: 10,
      columns: {
        id: true,
        orderNo: true,
        userId: true,
        username: true,
        status: true,
        createdAt: true,
      },
    });

    // 查询最近的所有订单（用于对比）
    const allRecentOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: 10,
      columns: {
        id: true,
        orderNo: true,
        userId: true,
        username: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      status: "logged_in",
      currentUser: {
        id: user.id,
        username: user.username,
        provider: user.provider,
      },
      userOrdersCount: userOrders.length,
      userOrders: userOrders.map(o => ({
        orderNo: o.orderNo,
        userId: o.userId,
        username: o.username,
        status: o.status,
        createdAt: o.createdAt,
      })),
      // 显示最近订单，用于对比 userId
      recentOrdersForDebug: allRecentOrders.map(o => ({
        orderNo: o.orderNo,
        userId: o.userId,
        username: o.username,
        status: o.status,
      })),
    });
  } catch (error) {
    console.error("[Debug Orders] Error:", error);
    return NextResponse.json({
      status: "error",
      message: String(error),
    }, { status: 500 });
  }
}

