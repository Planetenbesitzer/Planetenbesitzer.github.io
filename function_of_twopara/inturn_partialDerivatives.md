# multiplication of derivatives of rotate paras gives 1

--------

讨论的公式为:
$$
\left(\frac{\partial z}{\partial x}\right)_{y} \left(\frac{\partial x}{\partial y}\right)_{z}\left(\frac{\partial y}{\partial z}\right)_{x} = -1
$$
我们可以看到这个公式好奇怪,现在尝试证明一下



## 方法一



我们首先有二元函数
$$
z = z(x,y)
$$
然后对它求导, 因为这里只有三个变量, 实际上任意一个变量可以看作另外两个变量的函数, 于是$z = z(x,y) = z(x, y(x,z))$.
$$
\left(\frac{\partial z}{\partial x}\right)_z = \left(\frac{\partial z}{\partial x}\right)_y + \left(\frac{\partial z}{\partial y}\right)_x\left(\frac{\partial y}{\partial x}\right)_z
$$
the interesting thing is , 当保持$z$不变时,$\left(\frac{\partial z}{\partial x}\right)$当然为0. 于是我们得到:
$$
\begin{aligned}
&&0 & =\left(\frac{\partial z}{\partial x}\right)_y + \left(\frac{\partial z}{\partial y}\right)_x\left(\frac{\partial y}{\partial x}\right)_z\\
\Rightarrow&& -\left(\frac{\partial z}{\partial x}\right)_y &= \left(\frac{\partial z}{\partial y}\right)_x\left(\frac{\partial y}{\partial x}\right)_z\\

\Rightarrow&&-1 &= \left(\frac{\partial x}{\partial z}\right)_y\left(\frac{\partial z}{\partial y}\right)_x\left(\frac{\partial y}{\partial x}\right)_z
\end{aligned}
$$


这就是我们希望给出的结论.



## 方法二



使用同样的二元函数, 这次用如下的方法表示微分
$$
\mathrm{d}x = \left(\frac{\partial x}{\partial y}\right)_z\mathrm{d}y + \left(\frac{\partial x}{\partial z}\right)_y\mathrm{d}z\\
\mathrm{d}y = \left(\frac{\partial y}{\partial x}\right)_z\mathrm{d}x + \left(\frac{\partial y}{\partial z}\right)_x\mathrm{d}z
$$


把第二式带入第一式,可以得到
$$
\mathrm{d} x=\left(\frac{\partial x}{\partial y}\right)_{z}\left(\frac{\partial y}{\partial x}\right)_{z} \mathrm{~d} x+\left[\left(\frac{\partial x}{\partial y}\right)_{z}\left(\frac{\partial y}{\partial z}\right)_{x}+\left(\frac{\partial x}{\partial z}\right)_{y}\right] \mathrm{d} z
$$
直接对比两边,我们得到:
$$
\begin{gathered}
\left(\frac{\partial x}{\partial y}\right)_{z}=\frac{1}{\left(\dfrac{\partial y}{\partial x}\right)_{z}} \\
\left(\frac{\partial x}{\partial y}\right)_{z}\left(\frac{\partial y}{\partial z}\right)_{x}\left(\frac{\partial z}{\partial x}\right)_{y}=-1
\end{gathered}
$$




## 尝试作图, 几何意义

...

好难画啊

